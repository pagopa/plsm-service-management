"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
} from "@repo/ui";
import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components//ui/sidebar";

export default function Header({
  route,
}: {
  route: "overview" | "pnpg" | "firma-con-io";
}) {
  const router = useRouter();

  const getLabel = () => {
    switch (route) {
      case "overview":
        return "Overview";
      case "pnpg":
        return "PNPG";
      case "firma-con-io":
        return "Firma con IO";
      default:
        return "Dashboard";
    }
  };

  return (
    <header className="flex shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <SidebarTrigger className="size-4" />
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>Dashboard</BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getLabel()}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Button
        variant="pagopaprimary"
        size="sm"
        onClick={() => {
          router.push(`/dashboard/${route}`);
        }}
      >
        <SearchIcon className="size-3.5 opacity-60" />
        Cerca
      </Button>
    </header>
  );
}
