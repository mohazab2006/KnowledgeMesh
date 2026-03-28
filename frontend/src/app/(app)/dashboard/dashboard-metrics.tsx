"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspace } from "@/contexts/workspace-context";
import { ApiError, apiFetch } from "@/lib/api";
import type { WorkspaceDocumentStatsOut } from "@/types/api";

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

function MetricSkeletonCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="mt-3 h-9 w-16" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full max-w-[200px]" />
      </CardContent>
    </Card>
  );
}

export function DashboardMetrics() {
  const { active, activeId, loading: wsLoading } = useWorkspace();
  const [stats, setStats] = useState<WorkspaceDocumentStatsOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeId) {
      setStats(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const s = await apiFetch<WorkspaceDocumentStatsOut>(
        `v1/workspaces/${activeId}/documents/stats`,
      );
      setStats(s);
    } catch (e) {
      setStats(null);
      setError(e instanceof ApiError ? e.message : "Could not load metrics");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    if (!activeId) {
      setStats(null);
      setError(null);
      return;
    }
    setStats(null);
    void load();
  }, [activeId, load]);

  if (!wsLoading && (!activeId || !active)) {
    return (
      <p className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        Select a workspace from the header to load document metrics.
      </p>
    );
  }

  const initialLoading =
    wsLoading || !activeId || !active || (loading && stats === null);

  if (initialLoading && !error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricSkeletonCard />
        <MetricSkeletonCard />
        <div className="sm:col-span-2 lg:col-span-1">
          <MetricSkeletonCard />
        </div>
      </div>
    );
  }

  const showValues = Boolean(stats && activeId && active && !error);
  const indexed = stats?.indexed_count ?? 0;
  const processing = stats?.processing_count ?? 0;
  const queries = stats?.queries_24h;

  return (
    <div className="space-y-4">
      {error ? (
        <ErrorState
          title="Could not load metrics"
          message={error}
          action={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void load()}
              disabled={loading}
            >
              {loading ? "Retrying…" : "Try again"}
            </Button>
          }
        />
      ) : null}

      {!error ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>Documents</CardDescription>
                {loading && stats ? (
                  <Spinner
                    className="size-4 border-muted-foreground/30 border-t-foreground/60"
                    aria-label="Refreshing"
                  />
                ) : null}
              </div>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {showValues ? formatCount(indexed) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Indexed files across the active workspace.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Processing</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {showValues ? formatCount(processing) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Queued, uploading, or running through the worker pipeline.
              </p>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardDescription>Queries (24h)</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">
                {showValues
                  ? queries === null || queries === undefined
                    ? "—"
                    : formatCount(queries)
                  : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Citation-backed answers (logged when query analytics ship).
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
