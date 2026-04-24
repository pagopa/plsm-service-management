export const dynamic = "force-dynamic";

import { CertificatesSection } from "@/components/certificates/certificates-section";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getCertificates } from "@/lib/services/certificates.service";

export default async function CertificatiPage() {
  const { certificates, error } = await getCertificates();

  return (
    <div className="h-full w-full p-2">
      <div className="inline-flex w-full items-center justify-between border-b p-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <SidebarTrigger className="size-4" />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Dashboard</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Certificati</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <Card>
          <CardHeader>
            <h2 className="font-semibold mb-2 text-2xl">Certificati</h2>
          </CardHeader>
          <CardContent>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <CertificatesSection
                certificates={certificates.filter(
                  (c) => c.expiration_date > new Date().toISOString(),
                )}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
