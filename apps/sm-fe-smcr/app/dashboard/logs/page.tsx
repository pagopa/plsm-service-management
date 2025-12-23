export const dynamic = "force-dynamic";

import { RealTimeLogsTable } from "@/components/logs/logs-table";
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
    <div className="flex flex-col gap-3 h-full min-h-0 flex-1">
      <VolumeChart />

      <Card className="p-0 gap-0 flex flex-col flex-1 min-h-0">
        <CardHeader className="px-3 py-3 border-b border-neutral-200 pb-3!">
          <CardTitle>Logs</CardTitle>
          <CardDescription>
            Sorted by newest first • Click to inspect
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 flex-1 min-h-0">
          <RealTimeLogsTable initialData={data} />
        </CardContent>
      </Card>
    </div>
  );
}
