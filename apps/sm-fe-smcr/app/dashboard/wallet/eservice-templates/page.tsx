export const dynamic = "force-dynamic";

import Link from "next/link";

import { EserviceTemplatesView } from "@/features/eservice-templates/eservice-templates-view";
import { getEserviceTemplates } from "@/lib/services/eservice-templates.service";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { PermissionGate } from "@/components/auth/permission-gate";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function EserviceTemplatesPage() {
  return (
    <PermissionGate
      permission="wallet.templates.read"
      returnUrl="/dashboard/wallet/eservice-templates"
    >
      <EserviceTemplatesContent />
    </PermissionGate>
  );
}

async function EserviceTemplatesContent() {
  const { data, error } = await getEserviceTemplates();

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
                <Link href="/dashboard/wallet">Wallet</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Template e-service</BreadcrumbPage>
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
          <EserviceTemplatesView rows={data} />
        )}
      </div>
    </div>
  );
}
