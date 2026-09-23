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
import type {
  DashboardNavigationItem,
  DashboardNavigationSection,
  NavigationIcon,
} from "@/lib/dashboard-navigation";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ChevronRight,
  FileSignature,
  FolderIcon,
  KeyRound,
  Monitor,
  PhoneIcon,
  Search,
  ShieldCheck,
  Smartphone,
  SquareTerminal,
  TextCursorInput,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigationIcons: Record<NavigationIcon, typeof ActivityIcon> = {
  activity: ActivityIcon,
  "file-signature": FileSignature,
  folder: FolderIcon,
  key: KeyRound,
  monitor: Monitor,
  phone: PhoneIcon,
  search: Search,
  "shield-check": ShieldCheck,
  smartphone: Smartphone,
  terminal: SquareTerminal,
  "text-input": TextCursorInput,
  users: Users,
  wallet: Wallet,
};

function isPathActive(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(`${path}/`);
}

function NavigationIcon({ icon }: { icon?: NavigationIcon }) {
  if (!icon) {
    return null;
  }

  const Icon = navigationIcons[icon];
  return <Icon className="size-4" />;
}

function NavCollapsibleItem({
  item,
  pathname,
}: {
  item: DashboardNavigationItem;
  pathname: string;
}) {
  const activeChildPath =
    item.children?.reduce<string | null>((best, child) => {
      if (!child.href || !isPathActive(pathname, child.href)) return best;
      return !best || child.href.length > best.length ? child.href : best;
    }, null) ?? null;
  const isChildActive = activeChildPath !== null;
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
        <NavigationIcon icon={item.icon} />
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
          {item.children?.map((child) => {
            if (!child.href) {
              return null;
            }

            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={child.href === activeChildPath}
                >
                  <Link href={child.href}>
                    <span>{child.label}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export function NavMain({
  sections,
}: {
  sections: DashboardNavigationSection[];
}) {
  const pathname = usePathname();

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label}>
          <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
          <SidebarMenu>
            {section.items.map((item) => {
              if (item.children) {
                return (
                  <NavCollapsibleItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                  />
                );
              }

              if (!item.href) {
                return null;
              }

              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href}>
                    <SidebarMenuButton
                      tooltip={item.label}
                      isActive={isPathActive(pathname, item.href)}
                    >
                      <NavigationIcon icon={item.icon} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
