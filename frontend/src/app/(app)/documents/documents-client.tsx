"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
import { ApiError, apiFetch, apiUpload } from "@/lib/api";
import type { DocumentOut } from "@/types/api";

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

export function DocumentsClient() {
  const { active, activeId, loading: wsLoading } = useWorkspace();
  const [docs, setDocs] = useState<DocumentOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  if (wsLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading workspace…</p>
    );
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploads for <span className="text-foreground">{active.name}</span>
            . Status updates when the worker pipeline runs (Milestone 4).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={onFileChange}
            aria-hidden
          />
          <Button
            type="button"
            onClick={onPickFile}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading documents…</p>
      ) : docs.length === 0 ? (
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
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">
                    {d.original_filename}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
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
