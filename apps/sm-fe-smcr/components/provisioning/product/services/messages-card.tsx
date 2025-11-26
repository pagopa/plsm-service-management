"use client";

import { ArrowDownUpIcon, CalendarIcon, FileDigitIcon } from "lucide-react";
import { DatePicker } from "./date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getMessagesCount } from "@/lib/services/services-messages.service";
import { format } from "date-fns";

type Props = {
  serviceId: string;
};

const DEFAULT_DATE = "2024-10-23";

export default function MessagesCard({ serviceId }: Props) {
  const [messagesCount, setMessagesCount] = useState(0);
  const [date, setDate] = useState<Date>(new Date(2025, 0, 1));
  const [featureLevel, setFeatureLevel] = useState("STANDARD");

  const handleMessagesFetch = async () => {
    const messages = await getMessagesCount(
      serviceId,
      featureLevel,
      date ? format(date, "yyyy-MM-dd") : DEFAULT_DATE,
    );

    setMessagesCount(messages.data.count);
  };

  useEffect(() => {
    handleMessagesFetch();
  }, [date, featureLevel]);

  return (
    <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-4 gap-4 flex flex-col w-full">
      <div className="grid grid-cols-[200px_1fr] items-start gap-4">
        <div className="flex items-center gap-2 text-muted-foreground [&>svg]:size-3.5">
          <CalendarIcon />
          <span className="text-sm">Date</span>
        </div>

        <DatePicker value={date} setValue={(value) => setDate(value)} />
      </div>

      <div className="grid grid-cols-[200px_1fr] items-start gap-4">
        <div className="flex items-center gap-2 text-muted-foreground [&>svg]:size-3.5">
          <ArrowDownUpIcon />
          <span className="text-sm">Feature Level</span>
        </div>

        <Select
          value={featureLevel}
          onValueChange={(value) => setFeatureLevel(value.toUpperCase())}
        >
          <SelectTrigger className="w-[180px] border-none bg-none shadow-none data-[size=default]:h-6 p-0 text-base m-0">
            <SelectValue placeholder="Feature Level" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-[200px_1fr] items-start gap-4">
        <div className="flex items-center gap-2 text-muted-foreground [&>svg]:size-3.5">
          <FileDigitIcon />
          <span className="text-sm">Messages number</span>
        </div>

        <p className="break-words">{messagesCount}</p>
      </div>
    </div>
  );
}
