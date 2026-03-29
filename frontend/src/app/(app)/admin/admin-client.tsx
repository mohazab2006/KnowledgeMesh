"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ApiError, apiFetch } from "@/lib/api";
import type { DiagnosticsResponse } from "@/types/api";

export function AdminDiagnosticsClient() {
  const [data, setData] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<DiagnosticsResponse>("v1/diagnostics");
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to load diagnostics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !data) {
    return <LoadingState message="Checking services…" />;
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Diagnostics"
        description="Authenticated probe of upstream service health endpoints. Use this to see which dependency is down without opening logs."
      />

      {error ? (
        <ErrorState
          title="Could not load diagnostics"
          message={error}
          action={
            <Button type="button" size="sm" variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          }
        />
      ) : null}

      <Card className="border-border/80">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Service probes</CardTitle>
            <CardDescription>
              Each row is a <code className="text-xs">GET /health</code> from the gateway.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {!data?.services.length ? (
            <p className="text-sm text-muted-foreground">No probes returned.</p>
          ) : (
            <ul className="space-y-3">
              {data.services.map((s) => (
                <li
                  key={s.name}
                  className="flex flex-col gap-1 rounded-lg border border-border/70 bg-muted/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium capitalize text-foreground">
                      {s.name}
                    </span>
                    <Badge variant={s.ok ? "success" : "destructive"}>
                      {s.ok ? "Up" : "Down"}
                    </Badge>
                  </div>
                  {s.detail ? (
                    <p className="text-xs text-muted-foreground sm:max-w-md sm:text-right">
                      {s.detail}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
