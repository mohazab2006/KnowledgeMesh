"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app/header";
import { Sidebar } from "@/components/app/sidebar";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/documents": "Documents",
  "/query": "Query",
};

function titleForPath(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  for (const [prefix, label] of Object.entries(titles)) {
    if (pathname.startsWith(`${prefix}/`)) return label;
  }
  return "KnowledgeMesh";
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const title = useMemo(() => titleForPath(pathname), [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  return (
    <div className="flex min-h-full">
      {mobileNavOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[1px] md:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-56 border-r border-border bg-card transition-transform duration-200 ease-out md:static md:z-0 md:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <Sidebar onNavigate={() => setMobileNavOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:min-h-full">
        <AppHeader title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
