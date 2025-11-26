import { getDelegations } from "@/lib/services/delegations.service";
import { DelegationsTable } from "./table";
import { columns } from "./table/columns";

type Props = {
  institutionId: string;
  institutionName: string;
};

export default async function DelegationsTab({
  institutionId,
  institutionName,
}: Props) {
  const { data, error } = await getDelegations(institutionId);

  if (error) {
    throw new Error();
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <DelegationsTable
        columns={columns}
        data={data || []}
        institutionId={institutionId}
        institutionName={institutionName}
      />
    </section>
  );
}
