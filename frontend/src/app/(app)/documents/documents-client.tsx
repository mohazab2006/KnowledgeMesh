"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { useWorkspace } from "@/contexts/workspace-context";
import { ApiError, apiFetch, apiFetchBlob, apiFetchText, apiUpload } from "@/lib/api";
import type { DocumentOut } from "@/types/api";

const UPLOAD_ACCEPT =
  ".pdf,.txt,.md,.markdown,.csv,.tsv,.json,.log,.html,.htm,.xml,.rst";

const TEXT_PREVIEW_EXT = new Set([
  ".txt",
  ".md",
  ".markdown",
  ".csv",
  ".tsv",
  ".json",
  ".log",
  ".html",
  ".htm",
  ".xml",
  ".rst",
]);

const PREVIEW_TEXT_MAX = 400_000;

function fileExtLower(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

/** What we can show in-app (PDF in iframe; text types as monospace). */
function previewKind(doc: DocumentOut): "pdf" | "text" | null {
  const name = doc.original_filename.toLowerCase();
  const ext = fileExtLower(name);
  const ct = (doc.content_type || "").toLowerCase();
  if (ct.includes("pdf") || ext === ".pdf") return "pdf";
  if (TEXT_PREVIEW_EXT.has(ext)) return "text";
  if (ct.startsWith("text/")) return "text";
  if (ct === "application/json" || ct === "application/xml") return "text";
  return null;
}

type PreviewModal =
  | { phase: "closed" }
  | { phase: "loading"; title: string }
  | { phase: "error"; title: string; message: string }
  | { phase: "pdf"; title: string; objectUrl: string }
  | { phase: "text"; title: string; text: string };

function statusVariant(status: string): NonNullable<BadgeProps["variant"]> {
  switch (status) {
    case "indexed":
      return "success";
    case "failed":
      return "destructive";
    case "queued":
    case "processing":
      return "warning";
    case "uploaded":
    default:
      return "secondary";
  }
}

function formatUpdated(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/80">
      <div className="grid grid-cols-[1fr_5rem_6.5rem_9rem_5rem] gap-3 border-b border-border bg-muted/25 px-4 py-3 sm:grid-cols-[1fr_6rem_7rem_10rem_6rem] sm:px-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-14" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-14 justify-self-end" />
      </div>
      <ul className="divide-y divide-border/80">
        {Array.from({ length: 6 }).map((_, i) => (
          <li
            key={i}
            className="grid grid-cols-[1fr_5rem_6.5rem_9rem_5rem] items-center gap-3 px-4 py-3.5 sm:grid-cols-[1fr_6rem_7rem_10rem_6rem] sm:px-5"
          >
            <Skeleton className="h-4 max-w-[min(100%,220px)]" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-14 justify-self-end rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentsClient() {
  const { active, activeId, loading: wsLoading } = useWorkspace();
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<PreviewModal>({
    phase: "closed",
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const previewBlobUrlRef = useRef<string | null>(null);

  const closePreview = useCallback(() => {
    if (previewBlobUrlRef.current) {
      URL.revokeObjectURL(previewBlobUrlRef.current);
      previewBlobUrlRef.current = null;
    }
    setPreviewModal({ phase: "closed" });
  }, []);

  useEffect(() => {
    return () => {
      if (previewBlobUrlRef.current) {
        URL.revokeObjectURL(previewBlobUrlRef.current);
        previewBlobUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (previewModal.phase === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewModal.phase, closePreview]);

  const load = useCallback(async () => {
    if (!activeId) {
      setDocs([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await apiFetch<DocumentOut[]>(
        `v1/workspaces/${activeId}/documents`,
      );
      setDocs(list);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load documents");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPickFile = () => inputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !activeId) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      await apiUpload<DocumentOut>(`v1/workspaces/${activeId}/documents`, fd);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (doc: DocumentOut) => {
    if (!activeId) return;
    if (
      !window.confirm(
        `Remove “${doc.original_filename}” from this workspace? The file will be deleted.`,
      )
    ) {
      return;
    }
    setDeletingId(doc.id);
    setError(null);
    try {
      await apiFetch<void>(`v1/workspaces/${activeId}/documents/${doc.id}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const openPreview = useCallback(
    async (doc: DocumentOut) => {
      if (!activeId) return;
      const kind = previewKind(doc);
      if (!kind) return;
      setPreviewModal({ phase: "loading", title: doc.original_filename });
      const path = `v1/workspaces/${activeId}/documents/${doc.id}/file`;
      try {
        if (kind === "pdf") {
          const blob = await apiFetchBlob(path);
          const objectUrl = URL.createObjectURL(blob);
          if (previewBlobUrlRef.current) {
            URL.revokeObjectURL(previewBlobUrlRef.current);
          }
          previewBlobUrlRef.current = objectUrl;
          setPreviewModal({
            phase: "pdf",
            title: doc.original_filename,
            objectUrl,
          });
        } else {
          let text = await apiFetchText(path);
          if (text.length > PREVIEW_TEXT_MAX) {
            text =
              text.slice(0, PREVIEW_TEXT_MAX) +
              "\n\n… (preview truncated; file is larger)";
          }
          setPreviewModal({
            phase: "text",
            title: doc.original_filename,
            text,
          });
        }
      } catch (err) {
        setPreviewModal({
          phase: "error",
          title: doc.original_filename,
          message:
            err instanceof ApiError ? err.message : "Could not load preview",
        });
      }
    },
    [activeId],
  );

  if (wsLoading) {
    return <LoadingState message="Loading workspace…" />;
  }

  if (!activeId || !active) {
    return (
      <EmptyState
        icon={<DocIcon />}
        title="Choose a workspace"
        description="Create a workspace first, then upload documents into it."
        action={
          <Button asChild variant="secondary">
            <Link href="/workspaces/new">New workspace</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description={
          <>
            Files in{" "}
            <span className="text-foreground">{active.name}</span>. Add PDFs and
            common text formats; select a row to preview when available.
          </>
        }
        aside={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={UPLOAD_ACCEPT}
              className="sr-only"
              onChange={onFileChange}
              aria-hidden
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void load()}
              disabled={loading || uploading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </Button>
            <Button type="button" onClick={onPickFile} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          title="Could not load documents"
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

      {!error && loading && docs.length === 0 ? (
        <DocumentsTableSkeleton />
      ) : null}
      {!error && !loading && docs.length === 0 ? (
        <EmptyState
          icon={<DocIcon />}
          title="No documents yet"
          description="Upload a file to register it in this workspace. It is queued for processing when workers are connected."
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={onPickFile}
              disabled={uploading}
            >
              Upload document
            </Button>
          }
        />
      ) : null}
      {!error && docs.length > 0 ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl border border-border/80 transition-opacity",
            loading && "pointer-events-none opacity-50",
          )}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-[260px]">
                    {previewKind(d) ? (
                      <button
                        type="button"
                        className="block max-w-full truncate text-left font-medium text-foreground underline-offset-4 hover:underline"
                        title={
                          d.status === "failed" && d.error_message
                            ? d.error_message
                            : "Quick view"
                        }
                        onClick={() => void openPreview(d)}
                      >
                        {d.original_filename}
                      </button>
                    ) : (
                      <span
                        className="block max-w-full truncate font-medium"
                        title={
                          d.status === "failed" && d.error_message
                            ? d.error_message
                            : d.original_filename
                        }
                      >
                        {d.original_filename}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatSize(d.size_bytes)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(d.status)}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatUpdated(d.updated_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={deletingId !== null}
                      onClick={() => void onDelete(d)}
                    >
                      {deletingId === d.id ? "Removing…" : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {previewModal.phase !== "closed" ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close preview"
            onClick={closePreview}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-preview-title"
            className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border/80 bg-background shadow-lg"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <p
                id="doc-preview-title"
                className="min-w-0 truncate text-sm font-medium text-foreground"
              >
                {previewModal.title}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={closePreview}
              >
                Close
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              {previewModal.phase === "loading" ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
                  <Spinner className="size-10" aria-label="Loading preview" />
                  <p className="text-sm">Loading preview…</p>
                </div>
              ) : null}
              {previewModal.phase === "error" ? (
                <p className="p-8 text-center text-sm text-destructive">
                  {previewModal.message}
                </p>
              ) : null}
              {previewModal.phase === "pdf" ? (
                <iframe
                  title={previewModal.title}
                  src={previewModal.objectUrl}
                  className="h-[min(70vh,720px)] w-full rounded-md border border-border bg-muted/30"
                />
              ) : null}
              {previewModal.phase === "text" ? (
                <pre className="h-[min(70vh,720px)] w-full overflow-auto whitespace-pre-wrap wrap-break-word rounded-md border border-border bg-muted/20 p-4 font-mono text-xs text-foreground">
                  {previewModal.text}
                </pre>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
  );
}
