import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { DashboardMetrics } from "./dashboard-metrics";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="space-y-10 md:space-y-12">
      <PageHeader
        size="lg"
        title="Overview"
        description="Document activity for the workspace selected in the header. Numbers refresh when you change workspace."
      />

      <DashboardMetrics />
    </div>
  );
}
