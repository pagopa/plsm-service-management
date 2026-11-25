"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ActivityIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LOG_RANGE_KEYS,
  LOG_RANGES,
  MAX_LOG_SEARCH_LENGTH,
  type LogFilters,
  type LogRange,
} from "@/lib/log-filters";
import Filters from "./filters";

type Props = {
  filters: LogFilters;
  onChange: (patch: Partial<LogFilters>) => void;
  onReset: () => void;
  children: ReactNode;
};

function LogSearch({
  query,
  onSearch,
}: {
  query: string;
  onSearch: (query: string) => void;
}) {
  const [draft, setDraft] = useState(query);
  useEffect(() => setDraft(query), [query]);
  return (
    <form
      className="min-w-0 flex-1 sm:max-w-md"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(draft.trim());
      }}
    >
      <InputGroup className="bg-background">
        <InputGroupInput
          aria-label="Cerca per messaggio o ID richiesta"
          placeholder="Cerca per messaggio o ID richiesta…"
          value={draft}
          maxLength={MAX_LOG_SEARCH_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          {draft ? (
            <InputGroupButton
              type="button"
              size="icon-sm"
              aria-label="Cancella ricerca"
              onClick={() => {
                setDraft("");
                onSearch("");
              }}
            >
              <XIcon aria-hidden="true" />
            </InputGroupButton>
          ) : null}
          <InputGroupButton
            type="submit"
            size="icon-sm"
            aria-label="Cerca nei log"
          >
            <SearchIcon aria-hidden="true" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export function LogsHeader({ filters, onChange, onReset, children }: Props) {
  const hasFilters = Boolean(
    filters.q || filters.level.length || filters.service.length,
  );
  return (
    <header className="flex shrink-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ActivityIcon
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <h1 className="text-lg font-medium">Log</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-full min-w-0 sm:w-auto sm:flex-1">
          <LogSearch query={filters.q} onSearch={(q) => onChange({ q })} />
        </div>
        <Select
          value={filters.range}
          onValueChange={(range: LogRange) => onChange({ range })}
        >
          <SelectTrigger
            aria-label="Periodo dei log"
            className="w-auto min-w-40 flex-1 bg-background sm:flex-none"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="motion-reduce:animate-none">
            {LOG_RANGE_KEYS.map((range) => (
              <SelectItem key={range} value={range}>
                {LOG_RANGES[range].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Filters filters={filters} onChange={onChange} />
      </div>
      {hasFilters ? (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Filtri attivi"
        >
          {filters.q ? (
            <FilterChip
              label={`Ricerca: ${filters.q}`}
              onRemove={() => onChange({ q: "" })}
            />
          ) : null}
          {filters.level.map((level) => (
            <FilterChip
              key={level}
              label={level}
              onRemove={() =>
                onChange({
                  level: filters.level.filter((item) => item !== level),
                })
              }
            />
          ))}
          {filters.service.map((service) => (
            <FilterChip
              key={service}
              label={service}
              onRemove={() =>
                onChange({
                  service: filters.service.filter((item) => item !== service),
                })
              }
            />
          ))}
          <Button variant="ghost" size="sm" onClick={onReset}>
            Azzera filtri
          </Button>
        </div>
      ) : null}
    </header>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-auto min-h-8 max-w-full whitespace-normal text-left text-xs font-normal"
      onClick={onRemove}
      aria-label={`Rimuovi filtro ${label}`}
    >
      <span className="min-w-0 wrap-anywhere">{label}</span>
      <XIcon aria-hidden="true" className="size-3" />
    </Button>
  );
}
