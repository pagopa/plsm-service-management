import { getServices } from "@/lib/services/services-messages.service";
import { ServicesTable } from "./table";
import { columns } from "./table/columns";

type Props = {
  institution: string;
  taxCode: string;
};

export default async function ServicesTab({ institution, taxCode }: Props) {
  const { data, error } = await getServices(
    `organization_fiscal_code:${taxCode}`,
  );

  if (error) {
    throw new Error(error);
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <ServicesTable
        institution={institution}
        columns={columns}
        data={data?.at(0)?.services || []}
      />
    </section>
  );
}
