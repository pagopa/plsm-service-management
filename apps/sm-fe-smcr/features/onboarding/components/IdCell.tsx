"use client";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@repo/ui";

import { Row } from "@tanstack/react-table";
import { ProductStatus } from "../types/productStatus";

type ActionCellProps = {
  row: Row<ProductStatus>;
};

export function IdCell({ row }: ActionCellProps) {
  const id = row.getValue("id") as string;

  return (
    <HoverCard>
      <HoverCardTrigger>{id.slice(0, 3) + "..."}</HoverCardTrigger>
      <HoverCardContent>
        <p>{id}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
