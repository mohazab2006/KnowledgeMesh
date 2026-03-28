import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border/80 px-6 py-4 md:px-10">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          KnowledgeMesh
        </span>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/register">Get started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="max-w-xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Team knowledge
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Answers from your documents—not from thin air
          </h1>
          <p className="mt-6 text-pretty text-base leading-relaxed text-muted-foreground">
            Organize content by workspace, upload what your team relies on, and
            ask questions in plain language—with sources you can verify.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">Create account</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
