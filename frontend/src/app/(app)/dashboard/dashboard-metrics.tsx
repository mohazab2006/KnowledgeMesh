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
import { cn } from "@/lib/utils";
import { ApiError, apiFetch } from "@/lib/api";
import type { WorkspaceDocumentStatsOut } from "@/types/api";

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
  );
}

const metricCardClass =
  "overflow-hidden border-border/80 bg-card/95 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md";

function MetricSkeletonCard() {
  return (
    <Card className={metricCardClass}>
      <CardHeader className="space-y-3 pb-2 pt-1">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-12 w-24 md:h-14 md:w-28" />
      </CardHeader>
      <CardContent className="pb-6 pt-0">
        <Skeleton className="h-5 w-full max-w-[240px]" />
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
      <p className="rounded-xl border border-dashed border-border/80 bg-card/90 px-6 py-12 text-center text-base leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm md:px-10 md:text-lg">
        Select a workspace in the header to load activity for that library.
      </p>
    );
  }

  const initialLoading =
    wsLoading || !activeId || !active || (loading && stats === null);

  if (initialLoading && !error) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        <MetricSkeletonCard />
        <MetricSkeletonCard />
        <MetricSkeletonCard />
      </div>
    );
  }

  const showValues = Boolean(stats && activeId && active && !error);
  const indexed = stats?.indexed_count ?? 0;
  const processing = stats?.processing_count ?? 0;
  const queries = stats?.queries_24h;
  const showQueries = showValues && queries !== null;

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState
          title="Could not load activity"
          message={error}
          action={
            <Button
              type="button"
              size="md"
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
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          <Card className={metricCardClass}>
            <CardHeader className="space-y-3 pb-2 pt-1">
              <div className="flex items-start justify-between gap-3">
                <CardDescription className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Ready to search
                </CardDescription>
                {loading && stats ? (
                  <Spinner
                    className="mt-0.5 size-5 shrink-0 border-muted-foreground/30 border-t-foreground/60"
                    aria-label="Refreshing"
                  />
                ) : null}
              </div>
              <CardTitle className="text-4xl font-semibold tabular-nums tracking-tight text-foreground md:text-5xl">
                {showValues ? formatCount(indexed) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 pt-0">
              <p className="text-base leading-relaxed text-muted-foreground">
                Documents fully indexed and available to the query engine.
              </p>
            </CardContent>
          </Card>
          <Card className={metricCardClass}>
            <CardHeader className="space-y-3 pb-2 pt-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                In progress
              </CardDescription>
              <CardTitle className="text-4xl font-semibold tabular-nums tracking-tight text-foreground md:text-5xl">
                {showValues ? formatCount(processing) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 pt-0">
              <p className="text-base leading-relaxed text-muted-foreground">
                Uploads still being chunked or embedded for search.
              </p>
            </CardContent>
          </Card>
          <Card className={cn(metricCardClass, "sm:col-span-2 lg:col-span-1")}>
            <CardHeader className="space-y-3 pb-2 pt-1">
              <CardDescription className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Questions (24h)
              </CardDescription>
              <CardTitle className="text-4xl font-semibold tabular-nums tracking-tight text-foreground md:text-5xl">
                {showQueries && queries != null ? formatCount(queries) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6 pt-0">
              <p className="text-base leading-relaxed text-muted-foreground">
                {showQueries
                  ? "Workspace queries recorded in the last 24 hours."
                  : showValues
                    ? "Query volume for this workspace is not tracked yet."
                    : "—"}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
