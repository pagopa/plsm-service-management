import { DataTable } from "./DataTable";
import { PendingType, stepFourPendingColumns } from "./StepFourPendingColumns";
type Props = {
  data: PendingType[];
};

function StepFourPendingTable({ data }: Props) {
  return (
    <div className="">
      <DataTable columns={stepFourPendingColumns} data={data} />
    </div>
  );
}

export default StepFourPendingTable;
