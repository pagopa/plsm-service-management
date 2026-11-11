export const dynamic = "force-dynamic";

import { LogsDashboard } from "@/components/logs/logs-dashboard";
import {
  loadLogFilters,
  MAX_LOG_SEARCH_LENGTH,
  serializeLogFilters,
} from "@/lib/log-filters";
import { readLogView } from "@/lib/services/logs.service";
import { hasCurrentPermission } from "@/lib/auth/dashboard-access";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await hasCurrentPermission("logs.read"))) redirect("/dashboard");
  const filters = await loadLogFilters(searchParams);
  filters.q = filters.q.trim().slice(0, MAX_LOG_SEARCH_LENGTH);
  const { data } = await readLogView(filters);
  return (
    <LogsDashboard
      initialView={data}
      initialQuery={serializeLogFilters(filters)}
    />
  );
}
