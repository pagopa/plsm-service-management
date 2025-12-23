"use client";

import { Pie, PieChart } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export function ChartPie({
  chartData,
  chartConfig,
  period,
}: {
  chartData: { product: string; count: number; fill: string }[];
  chartConfig: ChartConfig;
  period: string;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>{period}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[500px]"
        >
          <PieChart>
            <Pie data={chartData} dataKey="count" nameKey="product" />
            <ChartLegend
              content={<ChartLegendContent nameKey="product" />}
              className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center text-lg"
            />
            <ChartTooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
