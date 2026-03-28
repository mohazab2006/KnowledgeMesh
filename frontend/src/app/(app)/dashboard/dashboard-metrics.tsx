"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWorkspace } from "@/contexts/workspace-context";
import { ApiError, apiFetch } from "@/lib/api";
import type { WorkspaceDocumentStatsOut } from "@/types/api";

function formatCount(n: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(
    n,
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

  const showDash =
    wsLoading ||
    !activeId ||
    !active ||
    (loading && stats === null) ||
    error !== null;
  const indexed = stats?.indexed_count ?? 0;
  const processing = stats?.processing_count ?? 0;
  const queries = stats?.queries_24h;

  return (
    <div className="space-y-2">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Documents</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {showDash ? "—" : formatCount(indexed)}
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
              {showDash ? "—" : formatCount(processing)}
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
              {showDash
                ? "—"
                : queries === null || queries === undefined
                  ? "—"
                  : formatCount(queries)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Citation-backed answers (logged when query analytics ship).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
