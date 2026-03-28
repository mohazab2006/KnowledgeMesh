"use client";

import { Button } from "@/components/ui/button";

type AppHeaderProps = {
  title: string;
  onMenuClick: () => void;
};

export function AppHeader({ title, onMenuClick }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-8">
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
        <h1 className="truncate text-sm font-semibold text-foreground md:text-base">
          {title}
        </h1>
        <p className="truncate text-xs text-muted-foreground">
          Default workspace · RAG preview
        </p>
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
