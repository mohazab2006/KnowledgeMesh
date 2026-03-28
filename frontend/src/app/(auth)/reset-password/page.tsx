import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-muted-foreground">Loading reset form…</p>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
