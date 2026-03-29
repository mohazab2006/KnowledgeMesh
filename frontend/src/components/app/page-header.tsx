import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Right side: actions, badges */
  aside?: ReactNode;
  className?: string;
  /** Larger title and body for primary surfaces (e.g. dashboard). */
  size?: "default" | "lg";
};

export function PageHeader({
  title,
  description,
  aside,
  className,
  size = "default",
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-8 md:pb-10",
        className,
      )}
    >
      <div className="min-w-0 max-w-3xl space-y-2">
        <h2
          className={cn(
            "font-semibold tracking-tight text-foreground",
            size === "lg"
              ? "text-3xl md:text-4xl"
              : "text-2xl tracking-[-0.02em]",
          )}
        >
          {title}
        </h2>
        {description ? (
          <div
            className={cn(
              "leading-relaxed text-muted-foreground",
              size === "lg" ? "text-base md:text-lg" : "text-sm",
            )}
          >
            {description}
          </div>
        ) : null}
      </div>
      {aside ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{aside}</div>
      ) : null}
    </div>
  );
}
