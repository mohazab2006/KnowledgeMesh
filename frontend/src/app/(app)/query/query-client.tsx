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
import { ApiError, apiFetch, apiFetchRaw } from "@/lib/api";
import type { QueryCitation, QueryResponse } from "@/types/api";
import Link from "next/link";
import { cn } from "@/lib/utils";

const TOP_K = 8;

type StreamEv =
  | { type: "delta"; text: string }
  | { type: "meta"; chunks_retrieved: number }
  | { type: "done"; answer: string; citations: unknown[] }
  | { type: "error"; detail: string };

function parseSseBuffer(buffer: string): { events: StreamEv[]; rest: string } {
  const events: StreamEv[] = [];
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    const lines = block.split("\n").filter((l) => l.startsWith("data:"));
    if (lines.length === 0) continue;
    const payload = lines.map((l) => l.replace(/^data:\s?/, "")).join("\n");
    if (payload === "[DONE]") continue;
    try {
      events.push(JSON.parse(payload) as StreamEv);
    } catch {
      /* ignore malformed chunk */
    }
  }
  return { events, rest };
}

function normalizeCitations(raw: unknown[]): QueryCitation[] {
  const out: QueryCitation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (
      typeof o.chunk_id !== "string" ||
      typeof o.document_id !== "string" ||
      typeof o.chunk_index !== "number" ||
      typeof o.document_title !== "string" ||
      typeof o.excerpt !== "string"
    ) {
      continue;
    }
    const rd = o.relevance_distance;
    out.push({
      chunk_id: o.chunk_id,
      document_id: o.document_id,
      chunk_index: o.chunk_index,
      document_title: o.document_title,
      excerpt: o.excerpt,
      relevance_distance:
        typeof rd === "number" ? rd : rd === null ? null : null,
    });
  }
  return out;
}

export function QueryPageClient() {
  const { active, activeId, loading: wsLoading } = useWorkspace();
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamAnswer, setStreamAnswer] = useState("");
  const [useStream, setUseStream] = useState(true);
  const [useMmr, setUseMmr] = useState(true);

  const runStreaming = useCallback(
    async (q: string, wid: string) => {
      const res = await apiFetchRaw(`v1/workspaces/${wid}/query/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          query: q,
          top_k: TOP_K,
          use_mmr: useMmr,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = res.statusText;
        try {
          const j = JSON.parse(text) as { detail?: string };
          if (typeof j.detail === "string") msg = j.detail;
        } catch {
          if (text) msg = text.slice(0, 400);
        }
        throw new ApiError(res.status, msg, text);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const dec = new TextDecoder();
      let buf = "";
      let live = "";
      let finalResult: QueryResponse | null = null;
      let retrievedCount = TOP_K;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const { events, rest } = parseSseBuffer(buf);
        buf = rest;
        for (const ev of events) {
          if (ev.type === "delta") {
            live += ev.text;
            setStreamAnswer(live);
          } else if (ev.type === "meta") {
            retrievedCount = ev.chunks_retrieved;
          } else if (ev.type === "error") {
            throw new ApiError(502, ev.detail, ev);
          } else if (ev.type === "done") {
            finalResult = {
              answer: ev.answer,
              citations: normalizeCitations(ev.citations),
              chunks_retrieved: retrievedCount,
            };
          }
        }
      }

      const tail = parseSseBuffer(buf + "\n\n");
      for (const ev of tail.events) {
        if (ev.type === "meta") retrievedCount = ev.chunks_retrieved;
        if (ev.type === "error") throw new ApiError(502, ev.detail, ev);
        if (ev.type === "done") {
          finalResult = {
            answer: ev.answer,
            citations: normalizeCitations(ev.citations),
            chunks_retrieved: retrievedCount,
          };
        }
      }

      if (finalResult) {
        setResult(finalResult);
      } else if (live.trim()) {
        setResult({
          answer: live,
          citations: [],
          chunks_retrieved: TOP_K,
        });
      } else {
        throw new Error("Stream ended without a final answer.");
      }
      setStreamAnswer("");
    },
    [useMmr],
  );

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeId || !question.trim()) return;
      setLoading(true);
      setError(null);
      setResult(null);
      setStreamAnswer("");
      const q = question.trim();
      try {
        if (useStream) {
          await runStreaming(q, activeId);
        } else {
          const res = await apiFetch<QueryResponse>(
            `v1/workspaces/${activeId}/query`,
            {
              method: "POST",
              json: { query: q, top_k: TOP_K, use_mmr: useMmr },
            },
          );
          setResult(res);
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Query failed");
      } finally {
        setLoading(false);
      }
    },
    [activeId, question, useMmr, useStream, runStreaming],
  );

  const clear = () => {
    setQuestion("");
    setResult(null);
    setError(null);
    setStreamAnswer("");
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

  const displayAnswer =
    loading && useStream && streamAnswer ? streamAnswer : result?.answer ?? "";

  return (
    <div className="space-y-10">
      <PageHeader
        title="Query"
        description={
          <>
            Ask questions about your library in{" "}
            <span className="text-foreground">{active.name}</span>. Answers
            include sources you can open from the list on the right.
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
              <p className="text-sm text-muted-foreground">
                {useStream ? "Generating answer…" : "Searching your documents…"}
              </p>
            </div>
          ) : null}
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
            <CardDescription>
              Use clear language; we will match meaning, not just keywords.
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
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-foreground"
                    checked={useStream}
                    onChange={(e) => setUseStream(e.target.checked)}
                    disabled={loading}
                  />
                  Stream answer (SSE)
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-foreground"
                    checked={useMmr}
                    onChange={(e) => setUseMmr(e.target.checked)}
                    disabled={loading}
                  />
                  MMR rerank retrieval
                </label>
              </div>
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
          {displayAnswer ? (
            <div className="border-t border-border bg-muted/15 px-6 py-5">
              <h3 className="text-sm font-semibold text-foreground">Answer</h3>
              <div
                className={cn(
                  "mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground",
                  "rounded-lg border border-border/60 bg-card/50 p-4",
                )}
              >
                {displayAnswer.split(/\n{2,}/).map((para, i) => (
                  <p key={i} className="whitespace-pre-wrap">
                    {para}
                  </p>
                ))}
              </div>
              {result ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Based on {result.chunks_retrieved} passage
                  {result.chunks_retrieved === 1 ? "" : "s"} from your library.
                </p>
              ) : loading ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Streaming tokens…
                </p>
              ) : null}
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
                  ? "No sources were attached to this answer."
                  : "Sources from your documents will appear here after you run a query."}
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
