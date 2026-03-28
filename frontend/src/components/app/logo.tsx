import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
};

export function Logo({ className, href = "/dashboard" }: LogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground"
        aria-hidden
      >
        KM
      </span>
      <span className="min-w-0 truncate text-sm leading-tight">
        KnowledgeMesh
      </span>
    </Link>
  );
}
