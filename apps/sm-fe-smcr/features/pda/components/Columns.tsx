"use client";

import { ColumnDef } from "@tanstack/react-table";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

type Columns = {
  denominazioneEnte: string;
  codAmm: string;
  codiceFiscale: string;
  dataAdesione: string;
};
export const columns: ColumnDef<Columns>[] = [
  {
    accessorKey: "codiceFiscale",
    header: () => <div className="font-bold">Codice fiscale</div>,
    cell: ({ row }) => row.getValue("codiceFiscale"),
  },
  {
    accessorKey: "denominazioneEnte",
    header: () => <div className="font-bold">Denominazione</div>,
    cell: ({ row }) => row.getValue("denominazioneEnte"),
  },
  {
    accessorKey: "dataAdesione",
    header: () => <div className="font-bold">Data adesione</div>,
    cell: ({ row }) => row.getValue("dataAdesione"),
  },
  {
    accessorKey: "codAmm",
    header: () => <div className="font-bold">Codice Amm.</div>,
    cell: ({ row }) => row.getValue("codAmm"),
  },
];
