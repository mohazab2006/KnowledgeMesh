import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GatewayHealth } from "@/components/app/gateway-health";
import { DashboardMetrics } from "./dashboard-metrics";
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
            Document counts load from ingestion for the workspace you have
            selected. Query totals are not recorded yet.
          </p>
        </div>
        <Badge variant="accent">Milestone 1 · UI foundation</Badge>
      </div>

      <DashboardMetrics />

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
