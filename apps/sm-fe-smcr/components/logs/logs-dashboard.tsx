"use client";

import VolumeChart from "@/components/logs/volume-chart";
import { columns } from "@/components/logs/logs-table/columns";
import { LogsTable } from "@/components/logs/logs-table/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLiveLogs } from "@/hooks/use-live-logs";
import type { Log } from "@/lib/services/logs.service";

type Props = {
  initialData: Array<Log>;
};

export function LogsDashboard({ initialData }: Props) {
  const data = useLiveLogs(initialData);

  return (
    <>
      <VolumeChart logs={data} />

      <Card className="p-0 gap-0 flex flex-col flex-1 min-h-0">
        <CardHeader className="px-3 py-3 border-b border-neutral-200 pb-3!">
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            Sorted by newest first • Click to inspect
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0">
          <LogsTable data={data} columns={columns} />
        </CardContent>
      </Card>
    </>
  );
}
