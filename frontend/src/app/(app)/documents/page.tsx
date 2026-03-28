import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Documents",
};

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Uploads, processing state, and citations map back to these rows.
          </p>
        </div>
        <Button type="button" disabled>
          Upload
        </Button>
      </div>

      <EmptyState
        icon={<DocIcon />}
        title="No documents yet"
        description="Uploads and ingestion status will appear here once the ingestion service and worker pipeline are connected."
        action={
          <Button type="button" variant="secondary" disabled>
            Upload document
          </Button>
        }
      />

      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Table shell
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Status badges for document lifecycle states (queued, processing,
          indexed, failed).
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="opacity-70">
              <TableCell className="font-medium">Sample-handbook.pdf</TableCell>
              <TableCell>
                <Badge variant="warning">Processing</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">—</TableCell>
            </TableRow>
            <TableRow>
              <TableCell
                colSpan={3}
                className="h-16 text-center text-sm text-muted-foreground"
              >
                Your uploads will replace placeholder rows in Milestone 3.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function DocIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h8M8 9h2" />
    </svg>
  );
}
