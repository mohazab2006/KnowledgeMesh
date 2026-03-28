"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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
import type { ResetPasswordResponse } from "@/types/api";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token")?.trim() ?? "";

  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters");
      return;
    }
    if (!token.trim()) {
      setError("Missing reset token");
      return;
    }
    setPending(true);
    try {
      const res = await apiFetch<ResetPasswordResponse>(
        "v1/auth/reset-password",
        { method: "POST", json: { token: token.trim(), new_password: password } },
      );
      setSuccess(res.detail);
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New password</CardTitle>
        <CardDescription>
          Paste the token from your email or dev response, then choose a new
          password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={(e) => void onSubmit(e)}>
        <CardContent className="space-y-4">
          {error ? <ErrorState message={error} /> : null}
          {success ? (
            <p className="rounded-md border border-border bg-muted/30 p-4 text-sm text-foreground">
              {success}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="token">Reset token</Label>
            <Input
              id="token"
              name="token"
              type="text"
              autoComplete="off"
              placeholder="From email link or dev response"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              className="font-mono text-xs"
              disabled={Boolean(success)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={Boolean(success)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              disabled={Boolean(success)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-0 pt-2">
          {success ? (
            <Button
              type="button"
              className="w-full"
              onClick={() => router.push("/login")}
            >
              Sign in
            </Button>
          ) : (
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Updating…" : "Update password"}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/forgot-password"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Request a new link
            </Link>
            {" · "}
            <Link
              href="/login"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
