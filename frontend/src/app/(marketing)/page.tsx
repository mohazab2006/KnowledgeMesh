import type { SVGProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/app/logo";
import { NeuralMeshBackground } from "@/components/marketing/neural-mesh-background";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function MarketingPage() {
  return (
    <div className="relative min-h-full overflow-x-hidden bg-background">
      <NeuralMeshBackground />

      <div className="relative z-10">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/60 bg-background/80 px-5 py-3.5 backdrop-blur-md supports-backdrop-filter:bg-background/65 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-3 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Image
              src="/brand/mainlogo-KNM-removebg.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              KnowledgeMesh
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </nav>
        </header>

        {/* Hero */}
        <section className="relative flex min-h-dvh flex-col items-center justify-center px-6 pb-24 pt-8 md:px-10">
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-background/18 via-background/5 to-background"
            aria-hidden
          />
          <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <Logo href="/" variant="hero" className="mb-8 w-full" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Team knowledge
            </p>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Answers from your documents—not from thin air
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
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
          <a
            href="#what-you-get"
            className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="text-xs font-medium">Learn more</span>
            <ChevronDownIcon className="size-5 opacity-70" />
          </a>
        </section>

        {/* What you get */}
        <section
          id="what-you-get"
          className="scroll-mt-20 border-t border-border/60 bg-background/95 py-20 backdrop-blur-sm md:py-28"
        >
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <SectionHeading
              eyebrow="Why teams use it"
              title="One mesh for your knowledge"
              subtitle="Workspaces keep projects separate. Every answer is tied to real passages in your files—so you can trust what you read."
            />
            <div className="mt-16 grid gap-6 md:grid-cols-3">
              <Card className="border-border/70">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <WorkspaceIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Workspace isolation</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Separate libraries per team or project. Switch context without
                    mixing confidential material.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/70">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <SourcesIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Grounded answers</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Responses cite where they came from—document names and
                    excerpts you can open and check.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-border/70">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-foreground">
                    <MeshIcon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">Semantic search</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    Ask the way people talk. The system matches meaning, not just
                    keywords in filenames.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-background py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-6 md:px-10">
            <SectionHeading
              eyebrow="How it works"
              title="From upload to verified answer"
              subtitle="Uploads are processed in the background. When you ask a question, we retrieve relevant context and compose an answer—with sources listed beside it."
            />
            <ol className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  step: "01",
                  title: "Upload",
                  body: "Add PDFs and text-friendly files to a workspace.",
                },
                {
                  step: "02",
                  title: "Index",
                  body: "Content is chunked and embedded so it can be found by meaning.",
                },
                {
                  step: "03",
                  title: "Ask",
                  body: "Type a question in plain language on the Query page.",
                },
                {
                  step: "04",
                  title: "Verify",
                  body: "Review the answer and open cited sources on the right.",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="relative rounded-xl border border-border/70 bg-card/50 p-6 shadow-sm"
                >
                  <span className="font-mono text-xs font-medium tabular-nums text-accent">
                    {item.step}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/60 bg-muted/30 py-20 md:py-24">
          <div className="mx-auto max-w-2xl px-6 text-center md:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Ready to wire up your knowledge mesh?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Create an account and invite your team when you are ready.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link href="/register">Get started</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60 py-10 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} KnowledgeMesh</p>
        </footer>
      </div>
    </div>
  );
}

function WorkspaceIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M4 7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourcesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M9 12h6M9 16h4M8 4h8a2 2 0 012 2v14l-4-2-4 2-4-2V6a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MeshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="8" cy="8" r="2" fill="currentColor" opacity={0.9} />
      <circle cx="16" cy="6" r="2" fill="currentColor" opacity={0.7} />
      <circle cx="18" cy="16" r="2" fill="currentColor" opacity={0.9} />
      <circle cx="6" cy="16" r="2" fill="currentColor" opacity={0.7} />
      <path
        d="M9.5 9l5-2M10 10l6 5M8 14l2 1M14 17l-6-2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}
