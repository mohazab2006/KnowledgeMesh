"use client";

import Link from "next/link";
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

export function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your workspace credentials. Backend wiring arrives in Milestone 2.
        </CardDescription>
      </CardHeader>
      <form
        action="#"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-0 pt-2">
          <Button type="submit" className="w-full">
            Continue
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
