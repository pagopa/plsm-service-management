"use client";

import dayjs from "dayjs";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { Log, LogLevel } from "@/lib/services/logs.service";

export const description = "A stacked bar chart with a legend";

type ChartData = {
  date: string;
  debug: number;
  info: number;
  warn: number;
  error: number;
};

const LEVEL_KEYS: Record<LogLevel, keyof Omit<ChartData, "date">> = {
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
};

const LEVEL_LABELS: Record<keyof Omit<ChartData, "date">, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
};

function buildChartData(logs: Array<Log>): Array<ChartData> {
  const startDate = dayjs().startOf("day").subtract(29, "day");
  const endDate = dayjs().endOf("day");
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = startDate.add(index, "day").format("YYYY-MM-DD");

    return [
      date,
      {
        date,
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      },
    ] as const;
  });
  const dataByDate = new Map<string, ChartData>(days);

  for (const log of logs) {
    const timestamp = dayjs(log.timestamp);
    if (!timestamp.isValid()) {
      continue;
    }

    if (timestamp.isBefore(startDate) || timestamp.isAfter(endDate)) {
      continue;
    }

    const day = timestamp.format("YYYY-MM-DD");
    const item = dataByDate.get(day);
    if (!item) {
      continue;
    }

    item[LEVEL_KEYS[log.level]] += 1;
  }

  return Array.from(dataByDate.values());
}

const chartConfig = {
  debug: {
    label: "DEBUG",
    color: "var(--color-neutral-500)",
  },
  info: {
    label: "INFO",
    color: "var(--color-blue-500)",
  },
  warn: {
    label: "WARNING",
    color: "var(--color-amber-500)",
  },
  error: {
    label: "ERROR",
    color: "var(--color-red-500)",
  },
} satisfies ChartConfig;

type Props = {
  logs: Array<Log>;
};

export default function VolumeChart({ logs }: Props) {
  const chartData = buildChartData(logs);

  return (
    <Card className="p-3 gap-3 px-0">
      <CardHeader className="px-3">
        <div className="inline-flex items-center justify-between">
          <CardTitle>Volume dei log</CardTitle>
          <div className="inline-flex items-center gap-3 text-sm">
            <span className="font-mono text-neutral-500">[DEBUG]</span>
            <span className="font-mono text-blue-500">[INFO]</span>
            <span className="font-mono text-amber-500">[WARNING]</span>
            <span className="font-mono text-red-500">[ERROR]</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full"
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return dayjs(String(value)).format("MMM D");
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const key = String(
                      name,
                    ) as keyof Omit<ChartData, "date">;

                    return (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {LEVEL_LABELS[key] ?? name}
                        </span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    );
                  }}
                />
              }
            />
            <Bar
              dataKey="debug"
              stackId="logs"
              fill="var(--color-debug)"
              radius={[0, 0, 4, 4]}
              activeBar={(props: any) => (
                <Rectangle
                  {...props}
                  radius={[0, 0, 4, 4]}
                  style={{
                    ...props.style,
                    fill: "var(--color-debug)",
                  }}
                />
              )}
            />
            <Bar dataKey="info" stackId="logs" fill="var(--color-info)" />
            <Bar dataKey="warn" stackId="logs" fill="var(--color-warn)" />
            <Bar
              dataKey="error"
              stackId="logs"
              fill="var(--color-error)"
              radius={[4, 4, 0, 0]}
              activeBar={(props: any) => (
                <Rectangle
                  {...props}
                  radius={[4, 4, 0, 0]}
                  style={{
                    ...props.style,
                    fill: "var(--color-error)",
                  }}
                />
              )}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
