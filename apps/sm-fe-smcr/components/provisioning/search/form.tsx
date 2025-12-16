"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@uidotdev/usehooks";
import { ArrowRightIcon, CornerDownLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchInstitution({
  isPNPG = false,
}: {
  isPNPG?: boolean;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const [history] = useLocalStorage<{
    items: Array<{ id: string; name: string; taxCode: string }>;
  }>(`${isPNPG ? "institution-history-pnpg" : "institution-history"}`, {
    items: [],
  });

  return (
    <div className="flex flex-col gap-4">
      <form
        className="inline-flex gap-2 w-full"
        onSubmit={(event) => {
          event.preventDefault();
          if (isPNPG) router.push(`/dashboard/pnpg/${query.trim()}`);
          else router.push(`/dashboard/overview/${query.trim()}`);

          console.log("submit", query);
        }}
      >
        <Input
          placeholder="Codice fiscale"
          className="w-full"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
        />
        <Button variant="pagopaprimary" type="submit">
          Cerca <CornerDownLeft className="size-3.5 opacity-60" />
        </Button>
      </form>

      {history.items.length > 0 && (
        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground font-bold p-2">
            Ricerche recenti
          </p>

          <div className="flex flex-col gap-0.5">
            {history.items.map((item) => (
              <HistoryItem key={item.id} {...item} isPNPG={isPNPG} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function HistoryItem({
  id,
  name,
  taxCode,
  isPNPG = false,
}: {
  id: string;
  name: string;
  taxCode: string;
  isPNPG?: boolean;
}) {
  return (
    <Link
      id={id}
      href={
        isPNPG ? `/dashboard/pnpg/${taxCode}` : `/dashboard/overview/${taxCode}`
      }
      className="inline-flex items-center justify-between w-full cursor-pointer rounded-md p-2 group hover:bg-neutral-50"
    >
      <div className="inline-flex gap-2 items-baseline">
        <p className="font-normal group-hover:underline max-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis">
          {name}
        </p>
        <span className="text-muted-foreground text-sm">{taxCode}</span>
      </div>

      <ArrowRightIcon className="text-muted-foreground size-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
    </Link>
  );
}
