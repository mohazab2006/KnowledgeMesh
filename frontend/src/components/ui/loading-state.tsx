import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

type LoadingStateProps = {
  message?: string;
  className?: string;
};

export function LoadingState({
  message = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground",
        className,
      )}
    >
      <Spinner />
      <p className="text-sm">{message}</p>
    </div>
  );
}
