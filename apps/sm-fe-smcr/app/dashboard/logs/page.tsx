export const dynamic = "force-dynamic";

import { LogsDashboard } from "@/components/logs/logs-dashboard";
import { readLogs, readLogVolume } from "@/lib/services/logs.service";

export default async function Page() {
  const [logsResult, volumeResult] = await Promise.all([
    readLogs({ limit: 100 }),
    readLogVolume({ days: 30 }),
  ]);

  if (logsResult.error || !logsResult.data) {
    throw new Error(logsResult.error);
  }

  if (volumeResult.error || !volumeResult.data) {
    throw new Error(volumeResult.error);
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 min-w-0 w-full max-w-full overflow-hidden flex-1">
      <LogsDashboard
        initialData={logsResult.data}
        initialVolume={volumeResult.data}
      />
    </div>
  );
}
