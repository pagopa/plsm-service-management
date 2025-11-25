"use client";

import { format } from "date-fns";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { it } from "date-fns/locale";

export function DatePicker({
  name,
  defaultValue = new Date(Date.now()),
}: {
  name: string;
  defaultValue?: Date;
}) {
  const [date, setDate] = React.useState<Date>(defaultValue);

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full font-normal items-center justify-start"
          data-empty={!date}
        >
          {date ? (
            format(date, "PPP", {
              locale: it,
            })
          ) : (
            <span>Seleziona una data</span>
          )}

          <input type="hidden" name={name} value={date.toDateString()} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={setDate} required />
      </PopoverContent>
    </Popover>
  );
}
