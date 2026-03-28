import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/app/logo";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8">
        <Logo href="/" />
      </div>
      <div className="w-full max-w-[400px]">{children}</div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        Authentication is UI-only until{" "}
        <Link href="/" className="text-foreground underline-offset-4 hover:underline">
          Milestone 2
        </Link>
        .
      </p>
    </div>
  );
}
