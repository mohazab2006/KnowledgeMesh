import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GatewayHealth } from "@/components/app/gateway-health";
import { PageHeader } from "@/components/app/page-header";
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
    <div className="space-y-10">
      <PageHeader
        title="Overview"
        description="Live counts for the workspace selected in the header. Query volume will appear here once analytics are enabled."
        aside={
          <Badge variant="secondary" className="font-normal">
            Ingestion · RAG
          </Badge>
        }
      />

      <DashboardMetrics />

      <Card className="max-w-2xl border-border/80">
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
