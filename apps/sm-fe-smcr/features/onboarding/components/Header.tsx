import { DataTable } from "./DataTable";
import { stepFourHeaderColumns } from "./StepFourHeaderColumns";
type Props = {
  taxcode: string;
  businessName: string;
  productId?: string;
  subunit: string;
  subunitCode: string | undefined;
  product: string;
};
function Header({
  taxcode,
  businessName,
  productId,
  product,
  subunit,
  subunitCode,
}: Props) {
  return (
    <div className=" ui:bg-pagopa-primary ui:text-white py-12">
      <DataTable
        columns={stepFourHeaderColumns}
        className="no-border-table"
        data={[
          {
            productId: productId ?? "",
            product,
            businessName,
            subunit,
            subunitCode: subunitCode ?? "",
            taxcode,
          },
        ]}
      />
    </div>
  );
}

export default Header;
