import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { DashboardMetrics } from "./dashboard-metrics";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        title="Overview"
        description="Document activity for the workspace selected in the header."
      />

      <DashboardMetrics />
    </div>
  );
}
