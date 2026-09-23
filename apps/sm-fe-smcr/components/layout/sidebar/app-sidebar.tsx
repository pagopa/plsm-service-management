"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { DashboardNavigationSection } from "@/lib/dashboard-navigation";
import { FileText } from "lucide-react";
import Link from "next/link";
import { NavMain } from "../nav-main";
import { SidebarUser } from "./sidebar-user";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  sections: DashboardNavigationSection[];
};

export function AppSidebar({ sections, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarContent className="relative">
        <NavMain sections={sections} />

        <SidebarMenuItem className="mt-auto">
          <Link
            href="https://plsmpitnsa.blob.core.windows.net/documentazione/smcr/Manuale%20SMCR.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <SidebarMenuButton tooltip="Documentation">
              <FileText /> <span>Documentation</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUser />
      </SidebarFooter>
    </Sidebar>
  );
}
