"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/lib/protectedRoutes";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  groups,
}: {
  groups: {
    teamId: string;
    teamName: string;
    routes: ProtectedRoute[];
  }[];
}) {
  const pathname = usePathname();

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.teamId}>
          <SidebarGroupLabel>{group.teamName}</SidebarGroupLabel>
          <SidebarMenu>
            {group.routes.map((item) => (
              <SidebarMenuItem key={item.path}>
                <Link href={item.path}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={item.path === pathname}
                  >
                    {item.icon && <item.icon className="size-4" />}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
