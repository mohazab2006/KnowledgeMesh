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
        "group flex items-center gap-2 font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-md border border-border bg-muted text-xs font-bold text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
        KM
      </span>
      <span className="text-sm">KnowledgeMesh</span>
    </Link>
  );
}
