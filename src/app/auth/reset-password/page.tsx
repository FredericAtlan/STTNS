import { Suspense } from "react";
import ResetPasswordPage from "./ResetPasswordClient";

export default function ResetPasswordRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-sttns-cream px-4 text-sm text-sttns-muted">
          Loading…
        </div>
      }
    >
      <ResetPasswordPage />
    </Suspense>
  );
}
