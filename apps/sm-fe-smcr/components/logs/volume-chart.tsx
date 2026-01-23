"use client";

import { Bar, BarChart, CartesianGrid, Rectangle, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

const chartData = [
  { date: "2025-10-13", logs: 120 },
  { date: "2025-10-14", logs: 140 },
  { date: "2025-10-15", logs: 180 },
  { date: "2025-10-16", logs: 220 },
  { date: "2025-10-17", logs: 260 },
  { date: "2025-10-18", logs: 210 },
  { date: "2025-10-19", logs: 240 },
  { date: "2025-10-20", logs: 300 },
  { date: "2025-10-21", logs: 280 },
  { date: "2025-10-22", logs: 250 },
  { date: "2025-10-23", logs: 190 },
  { date: "2025-10-24", logs: 160 },
  { date: "2025-10-25", logs: 140 },
  { date: "2025-10-26", logs: 170 },
  { date: "2025-10-27", logs: 210 },
  { date: "2025-10-28", logs: 260 },
  { date: "2025-10-29", logs: 310 },
  { date: "2025-10-30", logs: 340 },
  { date: "2025-10-31", logs: 320 },
  { date: "2025-11-01", logs: 290 },
  { date: "2025-11-02", logs: 260 },
  { date: "2025-11-03", logs: 240 },
  { date: "2025-11-04", logs: 220 },
  { date: "2025-11-05", logs: 200 },
  { date: "2025-11-06", logs: 230 },
  { date: "2025-11-07", logs: 270 },
  { date: "2025-11-08", logs: 310 },
  { date: "2025-11-09", logs: 360 },
  { date: "2025-11-10", logs: 390 },
  { date: "2025-11-11", logs: 370 },
  { date: "2025-11-12", logs: 340 },
  { date: "2025-11-13", logs: 310 },
  { date: "2025-11-14", logs: 280 },
  { date: "2025-11-15", logs: 260 },
  { date: "2025-11-16", logs: 240 },
  { date: "2025-11-17", logs: 270 },
  { date: "2025-11-18", logs: 300 },
  { date: "2025-11-19", logs: 340 },
  { date: "2025-11-20", logs: 380 },
  { date: "2025-11-21", logs: 420 },
];

const chartConfig = {
  logs: {
    label: "Logs",
    color: "var(--chart-bar)",
  },
} satisfies ChartConfig;

export default function VolumeChart() {
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
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="logs"
              stackId="a"
              fill="var(--color-logs)"
              radius={[4, 4, 4, 4]}
              activeBar={(props: any) => (
                <Rectangle
                  {...props}
                  radius={[4, 4, 4, 4]}
                  style={{
                    ...props.style,
                    fill: "var(--color-neutral-700, rgb(64 64 64))",
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
