"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircleIcon, SearchIcon } from "lucide-react";
import Form from "next/form";
import { useFormStatus } from "react-dom";

type Props = {
  taxCode?: string;
};

export default function SearchForm({ taxCode = "" }: Props) {
  return (
    <section className="w-full p-4 border-b flex flex-col gap-4">
      <div className="">
        <p className="font-medium">Ricerca</p>

        <p className="text-sm text-muted-foreground">
          Inserisci le informazioni dell'ente per visualizzare la lista degli
          utenti.
        </p>
      </div>

      <Form
        action="/dashboard/overview"
        className="w-full inline-flex items-center gap-2"
      >
        <Input name="taxCode" placeholder="Tax code" defaultValue={taxCode} />

        <SearchFormButton />
      </Form>
    </section>
  );
}

function SearchFormButton() {
  const status = useFormStatus();

  return (
    <div>
      <Button size="sm" type="submit" disabled={status.pending}>
        {status.pending ? (
          <LoaderCircleIcon className="opacity-60 animate-spin size-3.5 -ml-1" />
        ) : (
          <SearchIcon className="opacity-60 size-3.5 -ml-1" />
        )}
        Search
      </Button>
    </div>
  );
}
