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

type Props = {
  value: Date;
  setValue: (value: Date) => void;
};

export function DatePicker({ value, setValue }: Props) {
  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          data-empty={!value}
          className="data-[empty=true]:text-muted-foreground w-[180px] justify-start text-left font-normal h-6 p-0 bg-none text-base"
        >
          {value ? (
            format(value, "PPP", {
              locale: it,
            })
          ) : (
            <span>Seleziona una data</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={setValue} required />
      </PopoverContent>
    </Popover>
  );
}
