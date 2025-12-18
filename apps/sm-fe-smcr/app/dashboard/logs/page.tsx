export const dynamic = "force-dynamic";

import { columns, LogsTable } from "@/components/logs/logs-table";
import VolumeChart from "@/components/logs/volume-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { readLogs } from "@/lib/services/logs.service";

export default async function Page() {
  const { data, error } = await readLogs();

  if (error || !data) {
    throw new Error(error);
  }

  return (
    <div className="flex flex-col gap-3">
      <VolumeChart />

      <Card className="p-0 gap-0">
        <CardHeader className="px-3 py-3 border-b border-neutral-200 pb-3!">
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            Sorted by newest first • Click to inspect
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <LogsTable data={data} columns={columns} />
        </CardContent>
      </Card>
    </div>
  );
}
