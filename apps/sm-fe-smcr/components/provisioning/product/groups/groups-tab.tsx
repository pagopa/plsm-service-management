import { getUserGroups } from "@/lib/services/institution.service";
import { DataTable } from "./table";
import { columns } from "./table/columns";

type Props = {
  institution: string;
  product: string;
};

export default async function GroupsTab({ institution, product }: Props) {
  const groups = await getUserGroups({ institution });

  if (groups.error || !groups.data) {
    console.error(groups);
    throw new Error(groups.error || "Errore imprevisto");
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <DataTable
        institution={institution}
        columns={columns}
        data={
          groups.data.content.filter((item) => item.productId === product) || []
        }
      />
    </section>
  );
}
