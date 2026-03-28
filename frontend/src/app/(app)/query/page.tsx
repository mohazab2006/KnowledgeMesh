import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QueryForm } from "@/components/app/query-form";

export const metadata: Metadata = {
  title: "Query",
};

export default function QueryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Query
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ask questions grounded in workspace documents. Retrieval and LLM
          services wire up in a later milestone; the form below is UI-only for
          now.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <QueryForm />

        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="text-base">Sources</CardTitle>
            <CardDescription>
              Citations will list chunk IDs and document titles here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No retrieval run yet. The citation panel stays empty until an
              answer returns from the LLM service with mapped spans.
            </p>
          </CardContent>
          <CardFooter className="border-t border-border">
            <p className="py-2 text-sm leading-relaxed text-muted-foreground">
              No query has run yet. When RAG is enabled, ranked sources and
              excerpts will show here after each answer. This panel does not
              load in the background.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
