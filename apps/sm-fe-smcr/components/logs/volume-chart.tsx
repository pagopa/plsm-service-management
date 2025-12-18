"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
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
    <Card>
      <CardHeader>
        <CardTitle>Volume dei log</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
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
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="logs"
              stackId="a"
              fill="var(--color-logs)"
              radius={[4, 4, 4, 4]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
