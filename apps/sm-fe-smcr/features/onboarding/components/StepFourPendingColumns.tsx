"use client";

import { Checkbox } from "@repo/ui";
import { ColumnDef } from "@tanstack/react-table";
import { productsMap } from "../utils/constants";
import { dateFormat } from "../utils/dateFormat";
import StatusStepOne from "./StatusStepOne";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.

export type PendingType = {
  product: string;
  businessName: string;
  subunit: string;
  taxcode: string;
  subunitCode: string | undefined;
  productId?: string;
};

export const stepFourPendingColumns: ColumnDef<PendingType>[] = [
  {
    id: "select",
    header: () => <></>,
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
  },
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
    accessorKey: "productId",
    header: () => <div className="font-bold">Id</div>,
    cell: ({ row }) => <div className="">{row.getValue("productId")}</div>,
  },
];
