import { NextResponse } from "next/server";

import { isCruiseProviderError } from "@/lib/cruise-inventory/provider";

export function cruiseProviderErrorResponse(error: unknown) {
  if (isCruiseProviderError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        code: error.code,
        retryable: error.retryable,
      },
      { status: error.status },
    );
  }

  console.error("cruise inventory provider error", error);
  return NextResponse.json(
    {
      ok: false,
      error: "Unable to reach the cruise inventory service.",
      code: "supplier_unavailable",
      retryable: true,
    },
    { status: 503 },
  );
}
