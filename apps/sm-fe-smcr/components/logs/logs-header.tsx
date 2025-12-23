"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ActivityIcon, RefreshCcwIcon, SearchIcon, XIcon } from "lucide-react";
import Filters from "./filters";

export function LogsHeader() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  function closeSearch() {
    setIsSearchOpen(false);
    setSearchValue("");
  }

  function openSearch() {
    setIsSearchOpen(true);
  }

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <header className="inline-flex items-center justify-between px-2 gap-2">
      <div className="inline-flex gap-2 items-center shrink-0">
        <ActivityIcon className="size-3.5 opacity-60" />
        <p className="font-medium text-lg">Logs</p>
      </div>

      <div className="inline-flex items-center gap-2 min-w-0">
        {isSearchOpen ? (
          <InputGroup className="w-[256px] max-w-[50vw]">
            <InputGroupInput
              autoFocus
              placeholder="Cerca nei log..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  closeSearch();
                }
              }}
            />
            <InputGroupAddon align="inline-end" className="pr-2">
              <InputGroupButton
                size="icon-sm"
                aria-label="Chiudi ricerca"
                onClick={closeSearch}
              >
                <XIcon className="opacity-60" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        ) : null}

        {!isSearchOpen ? (
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={openSearch}
            aria-label="Cerca"
          >
            <SearchIcon className="opacity-60" />
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="icon"
          type="button"
          onClick={refresh}
          disabled={isPending}
          aria-label="Aggiorna"
        >
          <RefreshCcwIcon
            className={isPending ? "opacity-60 animate-spin" : "opacity-60"}
          />
        </Button>

        <Filters />
      </div>
    </header>
  );
}
