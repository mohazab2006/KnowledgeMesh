"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/contexts/workspace-context";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title: string;
  onMenuClick: () => void;
};

export function AppHeader({ title, onMenuClick }: AppHeaderProps) {
  const { active, workspaces, loading, setActiveWorkspace } = useWorkspace();

  return (
    <header className="sticky top-0 z-30 flex h-[3.75rem] shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/85 md:px-8">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={onMenuClick}
      >
        <MenuIcon />
      </Button>
      <div className="min-w-0 flex-1">
        {title ? (
          <h1 className="truncate text-base font-semibold text-foreground md:text-lg">
            {title}
          </h1>
        ) : (
          <p className="truncate text-base font-semibold text-foreground md:text-lg">
            {active ? active.name : loading ? "Loading…" : "KnowledgeMesh"}
          </p>
        )}
        <p className="truncate text-sm text-muted-foreground">
          {active ? (
            <>
              <span className="capitalize">{active.role}</span>
              <span className="text-muted-foreground/70"> · </span>
              <span>active workspace</span>
            </>
          ) : loading ? (
            "Loading workspaces…"
          ) : (
            "Select a workspace"
          )}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor="workspace-select">
          Active workspace
        </label>
        <select
          id="workspace-select"
          className={cn(
            "h-10 max-w-[220px] cursor-pointer truncate rounded-lg border border-border/80 bg-card px-3 text-sm font-medium text-foreground",
            "shadow-sm transition-[box-shadow,border-color] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[240px]",
          )}
          value={active?.id ?? ""}
          disabled={loading || workspaces.length === 0}
          onChange={(e) => {
            if (e.target.value) setActiveWorkspace(e.target.value);
          }}
        >
          {workspaces.length === 0 ? (
            <option value="">No workspaces</option>
          ) : null}
          {workspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <Button variant="secondary" size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/workspaces/new">New workspace</Link>
        </Button>
      </div>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}
