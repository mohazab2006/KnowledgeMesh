"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { useWorkspace } from "@/contexts/workspace-context";
import { ApiError } from "@/lib/api";

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await createWorkspace(name.trim());
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create workspace");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          New workspace
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspaces isolate documents and retrieval. You can switch anytime from
          the header.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Name</CardTitle>
          <CardDescription>Shown in the workspace switcher and nav.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error ? <ErrorState message={error} /> : null}
            <div className="space-y-2">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product research"
                required
                minLength={1}
                maxLength={120}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create workspace"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
