import { TabWrapper } from "@/components/layout/tab-wrapper";
import { getAggregatedInstitutions } from "@/lib/services/delegations.service";
import { AggregatesTable } from "./table";

type Props = {
  institutionId: string;
  product: string;
};

export default async function AggregatesTab({ institutionId, product }: Props) {
  const { data, error } = await getAggregatedInstitutions(
    institutionId,
    product,
  );

  if (error) {
    return (
      <TabWrapper>
        <p className="font-medium text-lg">Enti Aggregati</p>
        <p className="text-sm text-destructive">{error}. Riprova più tardi.</p>
      </TabWrapper>
    );
  }

  return <AggregatesTable data={data} />;
}
