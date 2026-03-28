"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/app/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

type SidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

export function Sidebar({ onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-start border-b border-border/70 px-4 py-3 sm:px-5 sm:py-4">
        <Logo className="min-w-0" />
      </div>
      <nav
        className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4 sm:px-4"
        aria-label="Main"
      >
        {appNav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/workspaces/new"
          onClick={onNavigate}
          className={cn(
            "rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
            pathname === "/workspaces/new" && "bg-muted text-foreground",
          )}
        >
          New workspace
        </Link>
      </nav>
      <div className="mt-auto shrink-0 border-t border-border p-4 sm:p-5">
        <p
          className="break-all text-sm font-medium leading-snug text-foreground"
          title={user?.email}
        >
          {user?.email}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 w-full justify-start px-2 text-muted-foreground"
          onClick={() => logout()}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
