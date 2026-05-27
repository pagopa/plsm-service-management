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
import type { LogVolume } from "@/lib/services/logs.service";

export const description = "A stacked bar chart with a legend";

const LEVEL_LABELS: Record<keyof Omit<LogVolume, "date">, string> = {
  debug: "DEBUG",
  info: "INFO",
  warn: "WARNING",
  error: "ERROR",
};

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
  data: Array<LogVolume>;
};

export default function VolumeChart({ data }: Props) {
  return (
    <Card className="p-3 gap-3 px-0 w-full max-w-full min-w-0 overflow-hidden">
      <CardHeader className="px-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Volume dei log</CardTitle>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-mono text-neutral-500">[DEBUG]</span>
            <span className="font-mono text-blue-500">[INFO]</span>
            <span className="font-mono text-amber-500">[WARNING]</span>
            <span className="font-mono text-red-500">[ERROR]</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-3 min-w-0 max-w-full overflow-hidden">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[180px] w-full max-w-full min-w-0"
        >
          <BarChart accessibilityLayer data={data} barCategoryGap="20%">
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
                    ) as keyof Omit<LogVolume, "date">;

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
