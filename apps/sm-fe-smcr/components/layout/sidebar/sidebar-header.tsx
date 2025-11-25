"use client";

import { ChevronsUpDown, Plus } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/context/sessionProvider";
import { Team } from "@/lib/types/team";
import { useEffect } from "react";

export function TeamSwitcher({}: {}) {
  const { user, setUser } = useSession();
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState<Team | null>(null);

  useEffect(() => {
    const members = user?.membersOf;

    if (!user || !members || members.length === 0 || activeTeam?.id) return;

    const preferredId = user.activeTeam?.id ?? user.preferences?.teamId;

    const preferredMember = members.find(
      (member) => member.team.id === preferredId,
    );

    const fallbackMember = members[0];

    const selectedTeam = preferredMember?.team ?? fallbackMember?.team;

    if (selectedTeam) {
      setActiveTeam(selectedTeam);

      if (!user.activeTeam || user.activeTeam.id !== selectedTeam.id) {
        setUser({
          ...user,
          activeTeam: selectedTeam,
        });
      }
    }
  }, [user, user?.membersOf, activeTeam?.id, setUser]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                {activeTeam?.image && (
                  <img src={activeTeam.image} className="size-6" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeTeam?.name}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Teams
            </DropdownMenuLabel>
            {user?.membersOf &&
              user.membersOf.map((member, index) => (
                <DropdownMenuItem
                  key={member.team.name}
                  onClick={() => {
                    console.log("ACTIVE TEAM IN SETTING", member.team);
                    setActiveTeam(member.team);

                    if (user) {
                      setUser({
                        ...user,
                        activeTeam: member.team,
                      });
                    }
                    // router.push("/dashboard");
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-sm border">
                    <img src={member.team.image} className="size-4 shrink-0" />
                  </div>
                  {member.team.name}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
