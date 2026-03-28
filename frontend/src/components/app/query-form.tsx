"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function QueryForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask the mesh</CardTitle>
        <CardDescription>
          Natural language over your indexed corpus. Submit is disabled until the
          RAG pipeline is live.
        </CardDescription>
      </CardHeader>
      <form
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="query">Question</Label>
            <Textarea
              id="query"
              name="query"
              placeholder="What commitments are described in the vendor agreement?"
              rows={5}
              className="resize-y min-h-[140px]"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 border-t border-border">
          <Button type="button" variant="secondary" disabled>
            Clear
          </Button>
          <Button type="submit" disabled>
            Run query
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
