import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FunnelIcon } from "lucide-react";
import { FilterOption } from "./filter-option";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Filters() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" type="button">
          <FunnelIcon className="opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 flex flex-col gap-6" align="end">
        <div className="flex flex-col gap-2.5">
          <Label>Livelli</Label>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <FilterOption label="Debug" variant="debug" />
            <FilterOption label="Info" variant="info" defaultChecked />
            <FilterOption label="Warning" variant="warn" />
            <FilterOption label="Error" variant="error" defaultChecked />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>Servizi</Label>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <FilterOption label="SMCR" defaultChecked />
            <FilterOption label="AMA" defaultChecked />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>Servizi</Label>

          <Select defaultValue="1_hour">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleziona un'opzione" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>Range</SelectLabel>
                <SelectItem value="15_min">Ultimi 15 minuti</SelectItem>
                <SelectItem value="1_hour">Ultima ora</SelectItem>
                <SelectItem value="1_day">Ultime 24 ore</SelectItem>
                <SelectItem value="7_day">Ultimi 7 giorni</SelectItem>
                <SelectItem value="30_day">Ultimi 30 giorni</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
