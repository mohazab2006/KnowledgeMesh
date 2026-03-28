"use client";

import { useEffect, useState } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Spinner } from "@/components/ui/spinner";

export function GatewayHealth() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        if (!cancelled) setState("ok");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state === "loading") {
    return (
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Spinner className="size-5" aria-label="Checking gateway" />
        Checking gateway…
      </div>
    );
  }
  if (state === "error") {
    return (
      <ErrorState
        title="API unreachable"
        message="The gateway did not respond. With Docker, use the URL that proxies /api to the gateway (for example http://localhost:8080), or ensure docker compose is up and GATEWAY_INTERNAL_URL matches when running Next locally."
      />
    );
  }
  return (
    <p className="text-sm text-muted-foreground">
      <span className="font-medium text-emerald-600 dark:text-emerald-400">
        Connected
      </span>
      <span className="text-muted-foreground/80"> · </span>
      Gateway health check succeeded.
    </p>
  );
}
