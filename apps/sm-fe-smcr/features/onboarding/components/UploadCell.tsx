"use client";

import { Button } from "@repo/ui";
import { Row } from "@tanstack/react-table";
import { ProductStatus } from "../types/productStatus";
import { useFormContext } from "../context/FormContext";

type ActionCellProps = {
  row: Row<ProductStatus>;
};

export function UploadCell({ row }: ActionCellProps) {
  const { goToStepFour, handleStepFourData } = useFormContext();

  if (row.getValue("status") === "PENDING") {
    const taxcode = row.getValue("taxcode") as string;
    const subunit = row.getValue("subunit") as string;
    const subunitCode = row.getValue("subunitCode") as string;
    const businessName = row.getValue("businessName") as string;
    const product = row.getValue("product") as
      | ""
      | "prod-pagopa"
      | "prod-io"
      | "prod-pn"
      | "prod-interop"
      | "prod-io-sign";
    const productId = row.getValue("id") as string;

    return (
      <Button
        variant="pagopaprimary"
        onClick={() => {
          handleStepFourData({
            taxcode,
            subunit,
            subunitCode,
            businessName,
            product,
            productId,
          });
          goToStepFour();
        }}
      >
        Carica contratto
      </Button>
    );
  }
  return null;
}
