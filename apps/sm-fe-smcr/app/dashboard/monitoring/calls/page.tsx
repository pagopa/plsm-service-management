import Link from "next/link";
import { Construction } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function MonitoringCallsPage() {
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
              <span>Monitoring</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Calls</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="mt-4 flex min-h-[320px] items-center justify-center md:mt-6">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-xl border bg-white px-8 py-10 text-center shadow-sm">
          <Construction className="text-muted-foreground size-8" />
          <h1 className="text-lg font-medium">Work in progress</h1>
          <p className="text-muted-foreground text-sm">
            La pagina Calls è in lavorazione.
          </p>
        </div>
      </div>
    </div>
  );
}
