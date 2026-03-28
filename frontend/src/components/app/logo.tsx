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
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md bg-foreground",
          variant === "hero" ? "p-3 sm:p-4" : "p-2 sm:p-2.5",
          "dark:bg-transparent dark:p-0",
        )}
      >
        <Image
          src="/brand/mainlogo-KNM-removebg.png"
          alt="KnowledgeMesh logo: geometric network connected to an open book"
          width={512}
          height={512}
          className={imageClass}
          priority
        />
      </span>
    </Link>
  );
}
