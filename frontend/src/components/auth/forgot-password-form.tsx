"use client";

import Link from "next/link";
import { useState } from "react";
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
import { ApiError, apiFetch } from "@/lib/api";
import type { ForgotPasswordResponse } from "@/types/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<ForgotPasswordResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    setDone(null);
    try {
      const res = await apiFetch<ForgotPasswordResponse>(
        "v1/auth/forgot-password",
        { method: "POST", json: { email: email.trim() } },
      );
      setDone(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>
          If an account exists for this email, we will send reset instructions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={(e) => void onSubmit(e)}>
        <CardContent className="space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {done ? (
            <div className="rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground">
              {done.detail}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-0 pt-2">
          {done ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setDone(null)}
            >
              Start over
            </Button>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={pending || Boolean(done)}
          >
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
