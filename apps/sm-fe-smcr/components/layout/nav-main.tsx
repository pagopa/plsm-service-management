"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/lib/protectedRoutes";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function isPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavCollapsibleItem({
  item,
  pathname,
}: {
  item: ProtectedRoute;
  pathname: string;
}) {
  const childPaths = item.children?.map((child) => child.path) ?? [];
  const isChildActive = childPaths.some((path) => isPathActive(pathname, path));
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) {
      setOpen(true);
    }
  }, [isChildActive]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        tooltip={item.label}
        isActive={isChildActive}
        onClick={() => setOpen((current) => !current)}
      >
        {item.icon && <item.icon className="size-4" />}
        <span>{item.label}</span>
        <ChevronRight
          className={cn(
            "ml-auto size-4 transition-transform",
            open && "rotate-90",
          )}
        />
      </SidebarMenuButton>
      {open && (
        <SidebarMenuSub>
          {item.children?.map((child) => (
            <SidebarMenuSubItem key={child.path}>
              <SidebarMenuSubButton
                asChild
                isActive={isPathActive(pathname, child.path)}
              >
                <Link href={child.path}>
                  <span>{child.label}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

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
            {group.routes.map((item) =>
              item.children ? (
                <NavCollapsibleItem
                  key={item.label}
                  item={item}
                  pathname={pathname}
                />
              ) : (
                <SidebarMenuItem key={item.path}>
                  <Link href={item.path!}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isPathActive(pathname, item.path!)}
                    >
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
