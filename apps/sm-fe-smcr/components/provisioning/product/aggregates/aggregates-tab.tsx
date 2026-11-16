"use client";

import { useEffect, useState } from "react";
import { TabWrapper } from "@/components/layout/tab-wrapper";
import { getAggregatedInstitutions } from "@/lib/services/delegations.service";
import { AggregatesTable } from "./table";

type Props = {
  institutionId: string;
  product: string;
};

type Result = Awaited<ReturnType<typeof getAggregatedInstitutions>>;

export default function AggregatesTab({ institutionId, product }: Props) {
  const [result, setResult] = useState<Result | null>(null);

  // TabsContent mounts this component only when the tab is active.
  useEffect(() => {
    let cancelled = false;

    async function loadAggregates() {
      try {
        const response = await getAggregatedInstitutions(institutionId, product);
        if (!cancelled) {
          setResult(response);
        }
      } catch {
        if (!cancelled) {
          setResult({
            data: [],
            error: "Errore nel recupero degli enti aggregati",
          });
        }
      }
    }

    void loadAggregates();

    return () => {
      cancelled = true;
    };
  }, [institutionId, product]);

  if (!result) {
    return (
      <TabWrapper>
        <p className="font-medium text-lg">Enti Aggregati</p>
        <p role="status" className="text-sm text-muted-foreground">
          Caricamento degli enti aggregati...
        </p>
      </TabWrapper>
    );
  }

  const { data, error } = result;

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
