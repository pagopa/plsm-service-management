"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { LOG_LEVELS, type LogRange } from "@/lib/log-filters";
import { formatLogTimestamp } from "@/lib/log-dates";
import type { LogVolume } from "@/lib/services/logs.service";
import { LogLevelBadge } from "./log-badges";

const series = [
  { key: "debug", level: "DEBUG", color: "var(--color-neutral-500)" },
  { key: "info", level: "INFO", color: "var(--color-blue-600)" },
  { key: "warn", level: "WARN", color: "var(--color-amber-600)" },
  { key: "error", level: "ERROR", color: "var(--color-red-600)" },
  { key: "fatal", level: "FATAL", color: "var(--color-violet-600)" },
] as const;
const config = Object.fromEntries(
  series.map((item) => [item.key, { label: item.level, color: item.color }]),
) satisfies ChartConfig;

export default function LogVolumeChart({
  data,
  range,
}: {
  data: LogVolume[];
  range: LogRange;
}) {
  const [showTable, setShowTable] = useState(false);
  const dayAxis = range === "7_days" || range === "30_days";
  const formatter = new Intl.DateTimeFormat("it-IT", {
    timeZone: "UTC",
    ...(dayAxis
      ? ({ day: "2-digit", month: "2-digit" } as const)
      : ({ hour: "2-digit", minute: "2-digit" } as const)),
  });

  return (
    <div className="space-y-3 border-t px-3 py-3">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {series.map(({ key, level }) => (
          <div
            key={key}
            className="flex items-center gap-1.5 text-xs tabular-nums"
          >
            <LogLevelBadge level={level} />
            <span>
              {data
                .reduce((sum, row) => sum + row[key], 0)
                .toLocaleString("it-IT")}
            </span>
          </div>
        ))}
      </div>
      <ChartContainer
        config={config}
        className="h-32 w-full min-w-0 aspect-auto"
        aria-label="Numero di log per livello e intervallo, orari UTC"
      >
        <BarChart accessibilityLayer data={data} barCategoryGap="15%">
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickMargin={8}
            tickFormatter={(value) => formatter.format(new Date(value))}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) =>
                  `${formatLogTimestamp(payload[0]?.payload?.date)} UTC`
                }
                formatter={(value, name) => (
                  <div className="flex w-full items-center justify-between gap-4">
                    <span>{String(name).toUpperCase()}</span>
                    <span className="font-mono tabular-nums">
                      {Number(value).toLocaleString("it-IT")}
                    </span>
                  </div>
                )}
              />
            }
          />
          {series.map(({ key }) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="logs"
              fill={`var(--color-${key})`}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ChartContainer>
      <details onToggle={(event) => setShowTable(event.currentTarget.open)}>
        <summary className="w-fit cursor-pointer rounded-sm text-xs text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-foreground">
          Dati del grafico in tabella
        </summary>
        {showTable ? (
          <div
            className="mt-2 max-h-48 overflow-auto overscroll-contain"
            tabIndex={0}
            role="region"
            aria-label="Dati del grafico, scorri per tutti gli intervalli"
          >
            <table className="w-full text-left text-xs tabular-nums">
              <caption className="sr-only">
                Intervalli del grafico e conteggi per livello
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-2">
                    Inizio intervallo · UTC
                  </th>
                  {LOG_LEVELS.map((level) => (
                    <th scope="col" className="p-2" key={level}>
                      {level}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.date}>
                    <th
                      scope="row"
                      className="p-2 font-normal whitespace-nowrap"
                    >
                      {formatLogTimestamp(row.date)}
                    </th>
                    {series.map(({ key }) => (
                      <td className="p-2" key={key}>
                        {row[key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </details>
    </div>
  );
}
