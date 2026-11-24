export const dynamic = "force-dynamic";

import Link from "next/link";
import { Suspense } from "react";

import { parseOnboardedInstitutionsFilters } from "@/features/onboarding/onboarded-institutions/filters";
import { OnboardedInstitutionsLoading } from "@/features/onboarding/onboarded-institutions/onboarded-institutions-loading";
import { OnboardedInstitutionsView } from "@/features/onboarding/onboarded-institutions/onboarded-institutions-view";
import { getOnboardedInstitutions } from "@/lib/services/onboarded-institutions.service";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function OnboardedInstitutionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
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
                <Link href="/dashboard/onboarding">Onboarding</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Enti onboardati</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mt-4 md:mt-6">
        <Suspense fallback={<OnboardedInstitutionsLoading />}>
          <OnboardedInstitutionsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function OnboardedInstitutionsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [{ data, error }, params] = await Promise.all([
    getOnboardedInstitutions(),
    searchParams,
  ]);
  const initialFilters = parseOnboardedInstitutionsFilters(params);

  if (error || !data) {
    return (
      <p className="text-destructive text-sm" role="alert">
        {error ?? "Dati non disponibili."}
      </p>
    );
  }

  return (
    <OnboardedInstitutionsView
      key={JSON.stringify(initialFilters)}
      rows={data}
      initialFilters={initialFilters}
    />
  );
}
