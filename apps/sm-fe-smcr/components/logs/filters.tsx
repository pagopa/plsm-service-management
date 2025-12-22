import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FunnelIcon } from "lucide-react";
import { FilterOption, FilterOptionCheckbox } from "./filter-option";
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
import { useQueryState, parseAsArrayOf, parseAsString } from "nuqs";
import { LogLevel, LogService } from "@/lib/services/logs.service";
import { CheckedState } from "@radix-ui/react-checkbox";

export default function Filters() {
  const [levels, setLevels] = useQueryState(
    "level",
    parseAsArrayOf(parseAsString),
  );

  const [services, setServices] = useQueryState(
    "service",
    parseAsArrayOf(parseAsString),
  );

  const handleLevelChange = (value: CheckedState, level: LogLevel) => {
    if (value) {
      return setLevels((current) => (current ? [...current, level] : [level]));
    }

    if (levels?.length === 1) {
      return setLevels(null);
    }

    if (levels) {
      return setLevels(levels.filter((current) => current !== level));
    }
  };

  const handleServiceChange = (value: CheckedState, service: LogService) => {
    if (value) {
      return setServices((current) =>
        current ? [...current, service] : [service],
      );
    }

    if (services?.length === 1) {
      return setServices(null);
    }

    if (services) {
      return setServices(services.filter((current) => current !== service));
    }
  };

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
            <FilterOption variant="debug">
              <FilterOptionCheckbox
                variant="debug"
                label="Debug"
                checked={levels?.includes("DEBUG") || false}
                onCheckedChange={(value) => handleLevelChange(value, "DEBUG")}
              />
            </FilterOption>

            <FilterOption variant="info">
              <FilterOptionCheckbox
                variant="info"
                label="Info"
                checked={levels?.includes("INFO") || false}
                onCheckedChange={(value) => handleLevelChange(value, "INFO")}
              />
            </FilterOption>

            <FilterOption variant="warn">
              <FilterOptionCheckbox
                variant="warn"
                label="Warning"
                checked={levels?.includes("WARN") || false}
                onCheckedChange={(value) => handleLevelChange(value, "WARN")}
              />
            </FilterOption>

            <FilterOption variant="error">
              <FilterOptionCheckbox
                variant="error"
                label="Error"
                checked={levels?.includes("ERROR") || false}
                onCheckedChange={(value) => handleLevelChange(value, "ERROR")}
              />
            </FilterOption>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>Servizi</Label>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <FilterOption>
              <FilterOptionCheckbox
                label="SMCR"
                checked={services?.includes("SMCR") || false}
                onCheckedChange={(value) => handleServiceChange(value, "SMCR")}
              />
            </FilterOption>

            <FilterOption>
              <FilterOptionCheckbox
                label="AMA"
                checked={services?.includes("AMA") || false}
                onCheckedChange={(value) => handleServiceChange(value, "AMA")}
              />
            </FilterOption>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <Label>Range</Label>

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
