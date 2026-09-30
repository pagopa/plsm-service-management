"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { useState, type ChangeEventHandler } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Boundary = "from" | "to";

type DateTimeFilterProps = {
  id: string;
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  boundary: Boundary;
  disabled?: boolean;
  invalid?: boolean;
};

function applyTime(date: Date, hours: number, minutes: number, boundary: Boundary) {
  const next = new Date(date);
  if (boundary === "to") {
    next.setHours(hours, minutes, 59, 999);
  } else {
    next.setHours(hours, minutes, 0, 0);
  }
  return next;
}

export function DateTimeFilter({
  id,
  value,
  onChange,
  boundary,
  disabled,
  invalid,
}: DateTimeFilterProps) {
  const [open, setOpen] = useState(false);

  const handleDaySelect = (selected: Date | undefined) => {
    if (!selected) {
      return;
    }

    const defaultHours = boundary === "to" ? 23 : 0;
    const defaultMinutes = boundary === "to" ? 59 : 0;
    const hours = value ? value.getHours() : defaultHours;
    const minutes = value ? value.getMinutes() : defaultMinutes;
    onChange(applyTime(selected, hours, minutes, boundary));
    setOpen(false);
  };

  const handleTimeChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    if (!value) {
      return;
    }

    const [hoursStr, minutesStr] = event.target.value.split(":");
    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return;
    }

    onChange(applyTime(value, hours, minutes, boundary));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid || undefined}
            className="flex-1 justify-start font-normal"
          >
            <CalendarIcon className="size-4 opacity-70" />
            {value ? (
              format(value, "d MMM yyyy, HH:mm", { locale: it })
            ) : (
              <span className="text-muted-foreground">Seleziona data e ora</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            locale={it}
            selected={value}
            onSelect={handleDaySelect}
          />
        </PopoverContent>
      </Popover>

      {value && (
        <>
          <Input
            type="time"
            aria-label="Ora"
            step="60"
            disabled={disabled}
            value={format(value, "HH:mm")}
            onChange={handleTimeChange}
            className="w-28 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            disabled={disabled}
            aria-label="Rimuovi data"
            onClick={() => onChange(undefined)}
          >
            <X className="size-4" />
          </Button>
        </>
      )}
    </div>
  );
}
