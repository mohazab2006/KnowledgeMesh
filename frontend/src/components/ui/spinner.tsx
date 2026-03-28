import { cn } from "@/lib/utils";

type SpinnerProps = {
  className?: string;
  "aria-label"?: string;
};

export function Spinner({
  className,
  "aria-label": ariaLabel = "Loading",
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "size-8 shrink-0 animate-spin rounded-full border-2 border-muted border-t-foreground",
        className,
      )}
    />
  );
}
