import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { NeuralMeshBackground } from "@/components/marketing/neural-mesh-background";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <NeuralMeshBackground />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur-md supports-backdrop-filter:bg-background/65 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src="/brand/mainlogo-KNM-removebg.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              KnowledgeMesh
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">Home</Link>
            </Button>
          </nav>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 md:py-16">
          <div className="w-full max-w-[400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
