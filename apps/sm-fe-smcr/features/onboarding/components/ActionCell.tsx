import { Row } from "@tanstack/react-table";
import { ProductStatus } from "../types/productStatus";
import { DeleteCell } from "./DeleteCell";
import { UploadCell } from "./UploadCell";

type ActionCellProps = {
  row: Row<ProductStatus>;
};
export function ActionCell({ row }: ActionCellProps) {
  const isCompleted = row.getValue("status") === "COMPLETED";
  const isPending = row.getValue("status") === "PENDING";
  return (
    <>
      {isCompleted && <DeleteCell row={row} />}
      {isPending && <UploadCell row={row} />}
    </>
  );
}
