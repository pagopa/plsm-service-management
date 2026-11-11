"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { LOG_RANGES, type LogRange } from "@/lib/log-filters";
import type { LogVolume } from "@/lib/services/logs.service";

const LogVolumeChart = dynamic(() => import("./log-volume-chart"), {
  loading: () => (
    <p role="status" className="p-4 text-sm text-muted-foreground">
      Caricamento grafico…
    </p>
  ),
});

export default function VolumeChart({
  data,
  range,
}: {
  data: LogVolume[];
  range: LogRange;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = data.reduce(
    (sum, row) => sum + row.debug + row.info + row.warn + row.error + row.fatal,
    0,
  );
  return (
    <section
      className="shrink-0 overflow-hidden rounded-xl border bg-card"
      aria-label="Volume dei log"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="log-volume-chart"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2.5 text-left text-sm outline-offset-[-3px] focus-visible:outline-2 focus-visible:outline-foreground"
      >
        {expanded ? (
          <ChevronDownIcon className="size-4" aria-hidden="true" />
        ) : (
          <ChevronRightIcon className="size-4" aria-hidden="true" />
        )}
        <span className="font-medium">Volume dei log</span>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {total.toLocaleString("it-IT")} eventi ·{" "}
          {LOG_RANGES[range].bucketLabel}
        </span>
      </button>
      <div id="log-volume-chart" hidden={!expanded}>
        {expanded ? <LogVolumeChart data={data} range={range} /> : null}
      </div>
    </section>
  );
}
