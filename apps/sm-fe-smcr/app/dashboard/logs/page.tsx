export const dynamic = "force-dynamic";

import { LogsDashboard } from "@/components/logs/logs-dashboard";
import { readLogs } from "@/lib/services/logs.service";

export default async function Page() {
  const { data, error } = await readLogs();

  if (error || !data) {
    throw new Error(error);
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 flex-1">
      <LogsDashboard initialData={data} />
    </div>
  );
}
