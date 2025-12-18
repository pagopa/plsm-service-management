import { columns, Log, LogsTable } from "@/components/logs/logs-table";
import VolumeChart from "@/components/logs/volume-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
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
          <div>
            <LogsTable data={data} columns={columns} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const data: Array<Log> = [
  {
    id: "1",
    timestamp: "2025-12-18T08:15:01.123Z",
    level: "INFO",
    service: "SMCR",
    message: "Service started successfully",
  },
  {
    id: "2",
    timestamp: "2025-12-18T08:15:05.456Z",
    level: "DEBUG",
    service: "SMCR",
    message: "Initializing configuration loader",
    request: "req-001",
  },
  {
    id: "3",
    timestamp: "2025-12-18T08:15:07.002Z",
    level: "INFO",
    service: "AMA",
    message: "Received authentication request",
    request: "req-002",
  },
  {
    id: "4",
    timestamp: "2025-12-18T08:15:07.340Z",
    level: "WARN",
    service: "AMA",
    message: "Deprecated token format detected",
    request: "req-002",
  },
  {
    id: "5",
    timestamp: "2025-12-18T08:15:07.890Z",
    level: "INFO",
    service: "AMA",
    message: "Authentication completed",
    request: "req-002",
  },
  {
    id: "6",
    timestamp: "2025-12-18T08:16:10.112Z",
    level: "DEBUG",
    service: "SMCR",
    message: "Fetching user profile from cache",
    request: "req-003",
  },
  {
    id: "7",
    timestamp: "2025-12-18T08:16:10.998Z",
    level: "INFO",
    service: "SMCR",
    message: "Cache hit for user profile",
    request: "req-003",
  },
  {
    id: "8",
    timestamp: "2025-12-18T08:17:42.501Z",
    level: "INFO",
    service: "AMA",
    message: "Starting role validation",
    request: "req-004",
  },
  {
    id: "9",
    timestamp: "2025-12-18T08:17:42.880Z",
    level: "ERROR",
    service: "AMA",
    message: "Role validation failed: missing permissions",
    request: "req-004",
  },
  {
    id: "10",
    timestamp: "2025-12-18T08:18:03.214Z",
    level: "WARN",
    service: "SMCR",
    message: "Slow response from external dependency",
  },
  {
    id: "11",
    timestamp: "2025-12-18T08:18:05.776Z",
    level: "DEBUG",
    service: "SMCR",
    message: "Retrying external call",
    request: "req-005",
  },
  {
    id: "12",
    timestamp: "2025-12-18T08:18:06.901Z",
    level: "INFO",
    service: "SMCR",
    message: "External call completed successfully",
    request: "req-005",
  },
  {
    id: "13",
    timestamp: "2025-12-18T08:19:11.432Z",
    level: "INFO",
    service: "AMA",
    message: "Session created",
    request: "req-006",
  },
  {
    id: "14",
    timestamp: "2025-12-18T08:20:00.000Z",
    level: "DEBUG",
    service: "SMCR",
    message: "Heartbeat check OK",
  },
  {
    id: "15",
    timestamp: "2025-12-18T08:20:45.654Z",
    level: "INFO",
    service: "AMA",
    message: "User logged out",
    request: "req-007",
  },
  {
    id: "16",
    timestamp: "2025-12-18T08:21:10.333Z",
    level: "WARN",
    service: "SMCR",
    message: "Configuration value missing, using default",
  },
  {
    id: "17",
    timestamp: "2025-12-18T08:22:02.777Z",
    level: "DEBUG",
    service: "AMA",
    message: "Parsing request headers",
    request: "req-008",
  },
  {
    id: "18",
    timestamp: "2025-12-18T08:22:03.120Z",
    level: "INFO",
    service: "AMA",
    message: "Request headers parsed",
    request: "req-008",
  },
  {
    id: "19",
    timestamp: "2025-12-18T08:23:14.889Z",
    level: "ERROR",
    service: "SMCR",
    message: "Unhandled exception during processing",
    request: "req-009",
  },
  {
    id: "20",
    timestamp: "2025-12-18T08:23:15.004Z",
    level: "INFO",
    service: "SMCR",
    message: "Request marked as failed",
    request: "req-009",
  },
  {
    id: "21",
    timestamp: "2025-12-18T08:24:01.456Z",
    level: "DEBUG",
    service: "AMA",
    message: "Loading user roles from database",
    request: "req-010",
  },
  {
    id: "22",
    timestamp: "2025-12-18T08:24:02.789Z",
    level: "INFO",
    service: "AMA",
    message: "User roles loaded",
    request: "req-010",
  },
  {
    id: "23",
    timestamp: "2025-12-18T08:25:30.321Z",
    level: "WARN",
    service: "SMCR",
    message: "High memory usage detected",
  },
  {
    id: "24",
    timestamp: "2025-12-18T08:26:00.654Z",
    level: "INFO",
    service: "SMCR",
    message: "Memory usage back to normal",
  },
  {
    id: "25",
    timestamp: "2025-12-18T08:27:18.987Z",
    level: "DEBUG",
    service: "AMA",
    message: "Validating input payload",
    request: "req-011",
  },
  {
    id: "26",
    timestamp: "2025-12-18T08:27:19.221Z",
    level: "ERROR",
    service: "AMA",
    message: "Invalid input payload",
    request: "req-011",
  },
  {
    id: "27",
    timestamp: "2025-12-18T08:28:40.111Z",
    level: "INFO",
    service: "SMCR",
    message: "Background job scheduled",
  },
  {
    id: "28",
    timestamp: "2025-12-18T08:29:55.444Z",
    level: "DEBUG",
    service: "SMCR",
    message: "Executing background job",
    request: "req-012",
  },
  {
    id: "29",
    timestamp: "2025-12-18T08:29:58.999Z",
    level: "INFO",
    service: "SMCR",
    message: "Background job completed",
    request: "req-012",
  },
  {
    id: "30",
    timestamp: "2025-12-18T08:30:10.000Z",
    level: "INFO",
    service: "AMA",
    message: "Service shutdown initiated",
  },
];
