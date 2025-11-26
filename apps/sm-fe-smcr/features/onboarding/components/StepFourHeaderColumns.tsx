"use client";

import { ColumnDef } from "@tanstack/react-table";
import { productsMap } from "../utils/constants";
import { EnableProductIdHeader } from "./EnableProductIdHeader";
import { EnableSubunitCodeHeader } from "./EnableSubunitCodeHeader";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

type HeaderType = {
  product: string;
  businessName: string;
  subunit: string;
  taxcode: string;
  subunitCode: string;
  productId?: string;
};

export const stepFourHeaderColumns: ColumnDef<HeaderType>[] = [
  {
    accessorKey: "taxcode",
    header: () => (
      <div className=" text-white font-bold text-center">Codice Fiscale</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("taxcode")}</div>
    ),
  },
  {
    accessorKey: "subunit",
    header: () => (
      <div className="text-white font-bold text-center">Tipologia</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("subunit")}</div>
    ),
  },
  {
    accessorKey: "subunitCode",
    header: () => <EnableSubunitCodeHeader />,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("subunitCode")}</div>
    ),
  },
  {
    accessorKey: "businessName",
    header: () => (
      <div className="text-white font-bold text-center">Ragione Sociale</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("businessName")}</div>
    ),
  },
  {
    accessorKey: "productId",
    header: () => <EnableProductIdHeader />,
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("productId")}</div>
    ),
  },
  {
    accessorKey: "product",
    header: () => (
      <div className="text-white font-bold text-center">Prodotto</div>
    ),
    cell: ({ row }) => (
      <div className="text-center">
        {productsMap.get(row.getValue("product"))}
      </div>
    ),
  },
];
