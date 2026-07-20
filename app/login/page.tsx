import { Suspense } from "react";
import LoginScreen from "@/components/login-screen";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f8f4ea] font-bold text-[#043331]">Loading secure sign-in…</main>}>
      <LoginScreen />
    </Suspense>
  );
}
