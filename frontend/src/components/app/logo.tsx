import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  href?: string;
  /** Sidebar rail vs centered auth / marketing hero. */
  variant?: "sidebar" | "hero";
};

export function Logo({
  className,
  href = "/dashboard",
  variant = "sidebar",
}: LogoProps) {
  const imageClass =
    variant === "hero"
      ? "mx-auto h-auto max-h-32 w-auto max-w-[min(280px,85vw)] object-contain"
      : "h-auto max-h-[5.25rem] w-auto max-w-[11rem] object-contain object-left";

  return (
    <Link
      href={href}
      className={cn(
        "group block min-w-0 rounded-sm outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Image
        src="/brand/knowledgemesh-logo.png"
        alt="KnowledgeMesh"
        width={280}
        height={200}
        className={imageClass}
        priority
      />
    </Link>
  );
}
