"use client";

import { format, startOfYear, subDays } from "date-fns";
import { useEffect, useState, useTransition } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRODUCT_CARDS } from "@/lib/constants/dashboard-products";
import {
  callProductLabel,
  type CallsSummary,
  type CallsSummaryInput,
} from "@/lib/services/calls.schema";
import { getCallsSummary } from "@/lib/services/calls.service";
import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { value: "today", label: "Oggi" },
  { value: "7d", label: "7g" },
  { value: "30d", label: "30g" },
  { value: "year", label: "Anno" },
] as const;

type TimeRange = (typeof TIME_RANGES)[number]["value"];

const API_DATE_FORMAT = "dd/MM/yyyy";
const fmtNum = new Intl.NumberFormat("it-IT");

function toSummaryInput(range: TimeRange): CallsSummaryInput {
  const now = new Date();
  const from = {
    today: now,
    "7d": subDays(now, 6),
    "30d": subDays(now, 29),
    year: startOfYear(now),
  }[range];

  return {
    dateFrom: format(from, API_DATE_FORMAT),
    dateTo: format(now, API_DATE_FORMAT),
  };
}

function productColor(productId: string) {
  return (
    PRODUCT_CARDS.find((c) => c.productId === productId)?.color ??
    "var(--color-primary)"
  );
}

export function TopCalls() {
  const [range, setRange] = useState<TimeRange>("30d");
  const [summary, setSummary] = useState<CallsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let ignore = false;
    startTransition(async () => {
      const result = await getCallsSummary(toSummaryInput(range));
      if (ignore) {
        return;
      }
      if (result.success) {
        setSummary(result.data);
        setError(null);
      } else {
        setSummary(null);
        setError(result.message);
      }
    });
    return () => {
      ignore = true;
    };
  }, [range]);

  const total = summary?.totalCalls || 1;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col gap-3">
        <div>
          <CardTitle>Top call per prodotto</CardTitle>
          <CardDescription>
            {summary
              ? `${fmtNum.format(summary.totalCalls)} call totali`
              : "Call registrate nel periodo"}
          </CardDescription>
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as TimeRange)}>
          <TabsList>
            {TIME_RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value} disabled={isPending}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="flex-1">
        {isPending && !summary ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !summary || summary.roster.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nessuna call nel periodo selezionato.
          </p>
        ) : (
          <ol
            className={cn(
              "flex flex-col gap-4 transition-opacity",
              isPending && "opacity-50",
            )}
          >
            {summary.roster.map((item) => (
              <li key={item.productId} className="flex flex-col gap-1.5">
                <div className="inline-flex w-full items-center justify-between text-sm">
                  <span className="inline-flex items-center gap-2">
                    <span className="text-muted-foreground w-4">
                      {item.position}
                    </span>
                    <span className="font-medium">
                      {callProductLabel(item.productId)}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {fmtNum.format(item.calls)}
                    <span className="text-muted-foreground ml-1.5">
                      ({Math.round((item.calls / total) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.calls / total) * 100}%`,
                      backgroundColor: productColor(item.productId),
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
