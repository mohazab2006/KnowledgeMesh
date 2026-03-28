import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Right side: actions, badges */
  aside?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  aside,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-border/70 pb-8",
        className,
      )}
    >
      <div className="min-w-0 max-w-2xl space-y-1">
        <h2 className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {title}
        </h2>
        {description ? (
          <div className="text-sm leading-relaxed text-muted-foreground">
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
