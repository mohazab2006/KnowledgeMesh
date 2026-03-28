import * as React from "react";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: React.ReactNode;
  className?: string;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive",
        className,
      )}
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-sm opacity-90">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
