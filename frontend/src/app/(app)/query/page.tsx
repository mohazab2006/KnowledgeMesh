import type { Metadata } from "next";
import { QueryPageClient } from "./query-client";

export const metadata: Metadata = {
  title: "Query",
};

export default function QueryPage() {
  return <QueryPageClient />;
}
