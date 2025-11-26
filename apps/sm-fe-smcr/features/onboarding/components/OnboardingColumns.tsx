"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ProductStatus } from "../types/productStatus";
import { productsMap } from "../utils/constants";
import { dateFormat } from "../utils/dateFormat";
import { EnableDeletion } from "./EnableDeletion";
import StatusStepOne from "./StatusStepOne";
import { IdCell } from "./IdCell";
import { ActionCell } from "./ActionCell";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export const columns: ColumnDef<ProductStatus>[] = [
  {
    accessorKey: "product",
    header: () => <div className="font-bold">Prodotto</div>,
    cell: ({ row }) => productsMap.get(row.getValue("product")),
  },
  {
    accessorKey: "status",
    header: () => <div className="font-bold">Status</div>,
    cell: ({ row }) => <StatusStepOne status={row.getValue("status")} />,
  },
  {
    accessorKey: "createdAt",
    header: () => <div className="font-bold">Creato</div>,
    cell: ({ row }) => dateFormat(new Date(row.getValue("createdAt"))),
  },
  {
    accessorKey: "id",
    header: () => <div className="font-bold">Id</div>,
    cell: ({ row }) => <IdCell row={row} />,
  },
  {
    accessorKey: "deleteStatus",
    header: () => <EnableDeletion />,
    cell: ({ row }) => <ActionCell row={row} />,
  },
  {
    accessorKey: "taxcode",
    header: () => <></>,
    cell: () => <></>,
    meta: {
      className: "hidden-column",
    },
  },
  {
    accessorKey: "subunit",
    header: () => <></>,
    cell: () => <></>,
    meta: {
      className: "hidden-column",
    },
  },
  {
    accessorKey: "subunitCode",
    header: () => <></>,
    cell: () => <></>,
    meta: {
      className: "hidden-column",
    },
  },
  {
    accessorKey: "businessName",
    header: () => <></>,
    cell: () => <></>,
    meta: {
      className: "hidden-column",
    },
  },
  {
    accessorKey: "endpoint",
    header: () => <></>,
    cell: () => <></>,
    meta: {
      className: "hidden-column",
    },
  },
];
