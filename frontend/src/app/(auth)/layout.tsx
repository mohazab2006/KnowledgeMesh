import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Logo } from "@/components/app/logo";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex justify-center">
        <Logo href="/" variant="hero" />
      </div>
      <div className="w-full max-w-[400px]">{children}</div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Tokens are stored in <span className="font-mono">localStorage</span> for
        this milestone; prefer httpOnly cookies when hardening for production.
      </p>
    </div>
  );
}
