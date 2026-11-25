import { Badge } from "@/components/ui/badge";
import type { LogLevel, LogService } from "@/lib/services/logs.service";

const levelClasses: Record<LogLevel, string> = {
  DEBUG:
    "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  INFO: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
  WARN: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ERROR:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  FATAL:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300",
};

export function LogLevelBadge({ level }: { level: LogLevel }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs font-normal ${levelClasses[level]}`}
    >
      {level}
    </Badge>
  );
}

export function LogServiceBadge({ service }: { service: LogService }) {
  return (
    <Badge variant="outline" className="bg-muted font-normal">
      {service}
    </Badge>
  );
}
