"use client";

import { useMemo, useState } from "react";

import Trie from "@/features/pda/lib/Trie";
import { Card, CardContent } from "@/components/ui/card";
import { columns } from "./Columns";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./Command";
import { DataTable } from "./DataTable";
type Ente = {
  denominazioneEnte: string;
  codAmm: string;
  codiceFiscale: string;
  dataAdesione: string;
};
type Props = {
  data: Array<Ente>;
};

export function TaxcodeList({ data }: Props) {
  const [taxcode, setTaxcode] = useState<string>("");

  function createDb(data: Array<Ente>) {
    console.log("🚀 ~ createDb ~");
    const trie = new Trie();
    for (const el of data) {
      trie.insert(el.codiceFiscale, {
        denominazioneEnte: el.denominazioneEnte,
        codAmm: el.codAmm,
        dataAdesione: el.dataAdesione,
      });
    }
    return trie;
  }
  const db = useMemo(() => createDb(data), [data]);
  function handleAutocomplete(searchCode: string) {
    return db.autocomplete(searchCode)?.slice(0, 20);
  }
  const result =
    handleAutocomplete(taxcode)?.map((el) => {
      return {
        value: taxcode + el.value,
        data: {
          denominazioneEnte: el.data.denominazioneEnte,
          codAmm: el.data.codAmm,
          dataAdesione: el.data.dataAdesione,
        },
      };
    }) ?? [];

  return (
    <div className="container flex flex-col py-8  max-w-2xl mx-auto  ">
      <div className="">
        <div className="mb-8">
          <Command
            shouldFilter={false}
            className="rounded-lg border shadow-md md:min-w-[450px]"
          >
            <CommandInput
              className="md:min-w-[450px]"
              placeholder="Codice fiscale"
              value={taxcode}
              onValueChange={setTaxcode}
              maxLength={11}
            />
            <CommandList>
              <CommandEmpty>{`${taxcode.length !== 11 ? `Nessun CF inizia con ${taxcode}` : "Nessun risultato."}`}</CommandEmpty>
              <CommandGroup
                className={`${taxcode.length !== 11 ? "" : "hidden"}`}
                heading="Suggerimenti"
              >
                {result.map((el) => (
                  <CommandItem
                    key={el.value}
                    onSelect={() => {
                      setTaxcode(el.value);
                    }}
                  >
                    {`${el.value} - ${el.data.denominazioneEnte}`}
                  </CommandItem>
                ))}
              </CommandGroup>
              {taxcode.length === 11 && result.length === 1 && (
                <>
                  <CommandSeparator />
                  <CommandGroup className="flex justify-center">
                    <CommandItem>Trovato!</CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </div>
        <div>
          {result && taxcode.length === 11 && result.length === 1 && (
            <Card>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={result.map((el) => {
                    return {
                      denominazioneEnte: el.data.denominazioneEnte ?? "",
                      codAmm: el.data.codAmm ?? "",
                      dataAdesione: dateFormat(el.data.dataAdesione ?? ""),
                      codiceFiscale: el.value,
                    };
                  })}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function dateFormat(date: string) {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return String(date);
  }

  const formatted = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
  return formatted;
}
