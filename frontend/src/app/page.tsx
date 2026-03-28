export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="max-w-lg text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
          KnowledgeMesh
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900">
          Distributed RAG foundation
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          Monorepo scaffold is live. The premium app shell and design system land in
          Milestone 1.
        </p>
      </div>
    </div>
  );
}
