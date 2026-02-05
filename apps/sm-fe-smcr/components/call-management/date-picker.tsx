"use client";

import { format } from "date-fns";
import { it } from "date-fns/locale";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
  name,
  defaultValue = new Date(Date.now()),
}: {
  name: string;
  defaultValue?: Date;
}) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date>(defaultValue);

  const handleDaySelect = (selected: Date | undefined) => {
    if (!selected) {
      return;
    }

    const next = new Date(selected);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setDate(next);
    setOpen(false);
  };

  const handleTimeChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const value = event.target.value;
    const [hoursStr, minutesStr] = value.split(":");

    const hours = Number(hoursStr);
    const minutes = Number(minutesStr);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return;
    }

    const next = new Date(date);
    next.setHours(hours, minutes, 0, 0);
    setDate(next);
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <Button
            id={name}
            variant="outline"
            className="flex-1 font-normal items-center justify-start"
            data-empty={!date}
          >
            {date ? (
              format(date, "PPP", {
                locale: it,
              })
            ) : (
              <span>Seleziona una data</span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDaySelect}
            required
          />
        </PopoverContent>
      </Popover>

      <Input
        type="time"
        aria-label="Ora"
        step="60"
        value={format(date, "HH:mm")}
        onChange={handleTimeChange}
        className="w-28 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />

      <input
        type="hidden"
        name={name}
        value={format(date, "yyyy-MM-dd'T'HH:mm")}
      />
    </div>
  );
}
