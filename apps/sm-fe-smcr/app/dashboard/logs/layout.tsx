import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ActivityIcon, SearchIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  children: React.ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <div className="bg-neutral-50 h-screen w-full overflow-hidden p-3 flex flex-col gap-3">
      <header className="">
        <div className="inline-flex gap-2 items-center">
          <ActivityIcon className="size-3.5 opacity-60" />
          <p className="font-medium text-lg">Logs</p>
        </div>
      </header>

      <Card>
        <CardContent className="inline-flex gap-3 items-center">
          <InputGroup className="h-8!">
            <InputGroupInput placeholder="Search..." />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>

          <div className="inline-flex items-center gap-3">
            <Select>
              <SelectTrigger className="w-[180px]" size="sm">
                <SelectValue placeholder="Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="5_min">Ultimi 5 minuti</SelectItem>
                  <SelectItem value="15_min">Ultimi 15 minuti</SelectItem>
                  <SelectItem value="30_min">Ultimi 30 minuti</SelectItem>
                  <SelectItem value="1_hour">Ultima ora</SelectItem>
                  <SelectItem value="4_hour">Ultime 4 ore</SelectItem>
                  <SelectItem value="24_hour">Ultime 24 ore</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]" size="sm">
                <SelectValue placeholder="Servizio" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="smcr">SMCR</SelectItem>
                  <SelectItem value="ama">AMA</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger className="w-[180px]" size="sm">
                <SelectValue placeholder="Livello" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="DEBUG">Debug</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
