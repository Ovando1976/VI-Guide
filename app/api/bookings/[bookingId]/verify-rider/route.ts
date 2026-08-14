import { timingSafeEqual } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession(["driver", "admin", "dispatcher"]);
    const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    if (!/^\d{4}$/.test(code)) {
      return NextResponse.json({ error: "Enter the 4-digit rider PIN." }, { status: 400 });
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(params.bookingId);
    const secretRef = db.collection("bookingRiderSecrets").doc(params.bookingId);
    const eventRef = db.collection("tripEvents").doc();

    await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, secretSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(secretRef),
      ]);
      if (!bookingSnapshot.exists) throw new Error("Booking not found.");
      const booking = { id: bookingSnapshot.id, ...bookingSnapshot.data() } as RideBooking;
      const privileged = session.role === "admin" || session.role === "dispatcher";
      const assignedDriver =
        session.role === "driver" &&
        booking.driverId === (session.driverId ?? session.uid);
      if (!privileged && !assignedDriver) throw new Error("You cannot verify this rider.");
      if (booking.status !== "arrived") {
        throw new Error("Rider verification is available after the driver arrives.");
      }
      if (booking.riderVerification?.status === "verified") return;
      const storedCode = secretSnapshot.data()?.code;
      if (typeof storedCode !== "string" || !sameCode(code, storedCode)) {
        throw new Error("Rider PIN does not match.");
      }

      transaction.update(bookingRef, {
        riderVerification: {
          status: "verified",
          verifiedAt: FieldValue.serverTimestamp(),
          verifiedBy: session.uid,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.delete(secretRef);
      transaction.set(eventRef, {
        bookingId: params.bookingId,
        type: "rider_verified",
        actorType: privileged ? "admin" : "driver",
        actorId: session.uid,
        message: "Rider identity verified with trip PIN.",
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true, bookingId: params.bookingId, verified: true });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    const message = error instanceof Error ? error.message : "Rider verification failed.";
    const status = message.includes("not found") ? 404 : message.includes("cannot") ? 403 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}

function sameCode(candidate: string, stored: string) {
  const left = Buffer.from(candidate);
  const right = Buffer.from(stored);
  return left.length === right.length && timingSafeEqual(left, right);
}
