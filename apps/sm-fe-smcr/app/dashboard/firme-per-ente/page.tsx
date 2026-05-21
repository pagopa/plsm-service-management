export const dynamic = "force-dynamic";

import Link from "next/link";

import {
  FirmePerEnteView,
  type FirmePerEnteKpis,
} from "@/features/firme-per-ente/firme-per-ente-view";
import { inferEnteKind } from "@/features/firme-per-ente/entity-kind";
import {
  getFirmePerEnteReport,
  type FirmaPerEnteRow,
} from "@/lib/services/firme-per-ente.service";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

function buildKpis(rows: FirmaPerEnteRow[]): FirmePerEnteKpis {
  if (rows.length === 0) {
    return {
      totalFirme: 0,
      totalEnti: 0,
      topDescription: "—",
      topFirme: 0,
      mediaPerEnte: 0,
      universitaCount: 0,
      altriEnti: 0,
    };
  }
  const totalEnti = rows.length;
  const totalFirme = rows.reduce((s, r) => s + r.totale_firme, 0);
  const top = rows[0]!;
  let universitaCount = 0;
  for (const r of rows) {
    if (inferEnteKind(r.description) === "UNIVERSITÀ") universitaCount += 1;
  }
  return {
    totalFirme,
    totalEnti,
    topDescription: top.description,
    topFirme: top.totale_firme,
    mediaPerEnte: Math.round(totalFirme / totalEnti),
    universitaCount,
    altriEnti: Math.max(0, totalEnti - universitaCount),
  };
}

export default async function FirmePerEntePage() {
  const { data, error } = await getFirmePerEnteReport();

  return (
    <div className="h-full w-full p-2 md:p-4">
      <div className="inline-flex w-full items-center justify-between border-b p-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <SidebarTrigger className="size-4" />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/firma-con-io">Firme</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Firme per ente</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mt-4 md:mt-6">
        {error || !data ? (
          <p className="text-destructive text-sm" role="alert">
            {error ?? "Dati non disponibili."}
          </p>
        ) : (
          <FirmePerEnteView rows={data} kpis={buildKpis(data)} />
        )}
      </div>
    </div>
  );
}
