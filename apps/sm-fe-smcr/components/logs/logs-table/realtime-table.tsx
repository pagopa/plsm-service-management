"use client";

import { useLiveLogs } from "@/hooks/use-live-logs";
import { Log } from "@/lib/services/logs.service";
import { LogsTable } from "./table";
import { columns } from "./columns";

type Props = {
  initialData: Array<Log>;
};

export function RealTimeLogsTable({ initialData }: Props) {
  const data = useLiveLogs(initialData);

  return <LogsTable data={data} columns={columns} />;
}
