"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { LoadingState } from "@/components/ui/loading-state";

export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { ready, token, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!token || !user) {
      router.replace("/login");
    }
  }, [ready, token, user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <LoadingState message="Checking session…" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center">
        <LoadingState message="Redirecting to sign in…" />
      </div>
    );
  }

  return <>{children}</>;
}
