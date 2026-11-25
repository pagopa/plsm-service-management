"use client";

import { FunnelIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LOG_LEVELS, LOG_SERVICES, type LogFilters } from "@/lib/log-filters";
import { LogLevelBadge } from "./log-badges";

type Props = {
  filters: LogFilters;
  onChange: (patch: Partial<LogFilters>) => void;
};

export default function Filters({ filters, onChange }: Props) {
  const count = filters.level.length + filters.service.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          aria-label={count ? `Filtri, ${count} attivi` : "Filtri"}
        >
          <FunnelIcon aria-hidden="true" />
          Filtri
          {count > 0 ? (
            <span className="rounded bg-muted px-1.5 text-xs tabular-nums">
              {count}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 max-w-[calc(100vw-2rem)] space-y-5 motion-reduce:animate-none"
        align="end"
      >
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Livello</legend>
          <div className="grid grid-cols-2 gap-2">
            {LOG_LEVELS.map((level) => (
              <label
                key={level}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 has-[[data-state=checked]]:border-foreground/40"
              >
                <Checkbox
                  aria-label={level}
                  checked={filters.level.includes(level)}
                  onCheckedChange={(checked) =>
                    onChange({
                      level:
                        checked === true
                          ? [...filters.level, level]
                          : filters.level.filter((item) => item !== level),
                    })
                  }
                />
                <LogLevelBadge level={level} />
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-medium">Servizio</legend>
          {LOG_SERVICES.map((service) => (
            <label
              key={service}
              className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm has-[[data-state=checked]]:border-foreground/40"
            >
              <Checkbox
                aria-label={service}
                checked={filters.service.includes(service)}
                onCheckedChange={(checked) =>
                  onChange({
                    service:
                      checked === true
                        ? [...filters.service, service]
                        : filters.service.filter((item) => item !== service),
                  })
                }
              />
              {service}
            </label>
          ))}
        </fieldset>
      </PopoverContent>
    </Popover>
  );
}
