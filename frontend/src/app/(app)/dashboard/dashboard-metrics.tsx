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
        Select a workspace from the header to see activity.
      </p>
    );
  }

  const initialLoading =
    wsLoading || !activeId || !active || (loading && stats === null);

  if (initialLoading && !error) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricSkeletonCard />
        <MetricSkeletonCard />
      </div>
    );
  }

  const showValues = Boolean(stats && activeId && active && !error);
  const indexed = stats?.indexed_count ?? 0;
  const processing = stats?.processing_count ?? 0;

  return (
    <div className="space-y-4">
      {error ? (
        <ErrorState
          title="Could not load activity"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardDescription>Ready to search</CardDescription>
                {loading && stats ? (
                  <Spinner
                    className="size-4 border-muted-foreground/30 border-t-foreground/60"
                    aria-label="Refreshing"
                  />
                ) : null}
              </div>
              <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
                {showValues ? formatCount(indexed) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Documents fully indexed for this workspace.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>In progress</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums tracking-tight">
                {showValues ? formatCount(processing) : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uploads still being prepared for search.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
