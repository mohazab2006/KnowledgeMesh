"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/app/page-header";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspace } from "@/contexts/workspace-context";
import { ApiError, apiFetch } from "@/lib/api";
import type { QueryResponse } from "@/types/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function QueryPageClient() {
  const { active, activeId, loading: wsLoading } = useWorkspace();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeId || !question.trim()) return;
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await apiFetch<QueryResponse>(
          `v1/workspaces/${activeId}/query`,
          {
            method: "POST",
            json: { query: question.trim(), top_k: 8 },
          },
        );
        setResult(res);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Query failed");
      } finally {
        setLoading(false);
      }
    },
    [activeId, question],
  );

  const clear = () => {
    setQuestion("");
    setResult(null);
    setError(null);
  };

  if (wsLoading) {
    return <LoadingState message="Loading workspace…" />;
  }

  if (!activeId || !active) {
    return (
      <EmptyState
        title="Choose a workspace"
        description="Select or create a workspace so queries run against the right document set."
        action={
          <Button asChild variant="secondary">
            <Link href="/workspaces/new">New workspace</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Query"
        description={
          <>
            Retrieval + LLM over indexed chunks in{" "}
            <span className="text-foreground">{active.name}</span>. Requires{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              OPENAI_API_KEY
            </code>{" "}
            on retrieval and LLM services.
          </>
        }
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <Card className="relative overflow-hidden border-border/80">
          {loading ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-[2px]"
              aria-busy
            >
              <Spinner className="size-10" aria-label="Running query" />
              <p className="text-sm text-muted-foreground">Retrieving context…</p>
            </div>
          ) : null}
          <CardHeader>
            <CardTitle>Ask the mesh</CardTitle>
            <CardDescription>
              Natural language over your indexed corpus in this workspace.
            </CardDescription>
          </CardHeader>
          <form onSubmit={(e) => void onSubmit(e)}>
            <CardContent className="space-y-4">
              {error ? (
                <ErrorState
                  title="Query failed"
                  message={error}
                  action={
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  }
                />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="query">Question</Label>
                <Textarea
                  id="query"
                  name="query"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What commitments are described in the vendor agreement?"
                  rows={5}
                  className="min-h-[140px] resize-y"
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={clear}
                disabled={loading}
              >
                Clear
              </Button>
              <Button type="submit" disabled={loading || !question.trim()}>
                Run query
              </Button>
            </CardFooter>
          </form>
          {result ? (
            <div className="border-t border-border bg-muted/15 px-6 py-5">
              <h3 className="text-sm font-semibold text-foreground">Answer</h3>
              <div
                className={cn(
                  "mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground",
                  "rounded-lg border border-border/60 bg-card/50 p-4",
                )}
              >
                {result.answer.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Retrieved {result.chunks_retrieved} chunk
                {result.chunks_retrieved === 1 ? "" : "s"} for context.
              </p>
            </div>
          ) : null}
        </Card>

        <Card className="h-fit border-border/80 lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-base">Sources</CardTitle>
            <CardDescription>
              Passages the model cited from your documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!result || result.citations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {result && result.citations.length === 0
                  ? "No citations returned for this answer."
                  : "Run a query to see cited chunks and filenames here."}
              </p>
            ) : (
              <ul className="space-y-3 text-sm">
                {result.citations.map((c, i) => (
                  <li
                    key={`${c.chunk_id}-${i}`}
                    className="rounded-lg border border-border/70 bg-muted/20 p-3"
                  >
                    <p className="font-medium text-foreground">
                      {c.document_title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Chunk {c.chunk_index}
                      {c.relevance_distance != null
                        ? ` · distance ${c.relevance_distance.toFixed(4)}`
                        : null}
                    </p>
                    <p className="mt-2 text-muted-foreground">{c.excerpt}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
