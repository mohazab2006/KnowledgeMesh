import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GatewayHealth } from "@/components/app/gateway-health";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live metrics will connect to the API gateway in later milestones.
          </p>
        </div>
        <Badge variant="accent">Milestone 1 · UI foundation</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Documents</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              —
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Indexed files across the active workspace.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Processing</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              —
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Jobs in queue or worker pipeline.
            </p>
          </CardContent>
        </Card>
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2">
            <CardDescription>Queries (24h)</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              —
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Citation-backed answers served from retrieval + LLM.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">API status</CardTitle>
          <CardDescription>
            Live check against <code className="text-xs">/api/health</code> via
            the gateway.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GatewayHealth />
        </CardContent>
      </Card>
    </div>
  );
}
