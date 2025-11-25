"use client";

import { ChevronsUpDown, Plus, UserIcon, UserRound } from "lucide-react";
import * as React from "react";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Label,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@repo/ui";
import { Member, UserWithMembers } from "@/lib/types/member";
import { useEffect } from "react";
import { Team } from "@/lib/types/team";
import { UserProfile } from "@/lib/types/userProfile";
import { useSession } from "@/context/sessionProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function NavHeader({ members }: { members: Array<Member> | undefined }) {
  const { isMobile } = useSidebar();
  const { user, setUser } = useSession();
  const [activeTeam, setActiveTeam] = React.useState({} as Team);
  const router = useRouter();

  useEffect(() => {
    // Protezione: se non c'è nulla da fare, esci subito
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
  }, [user, members, activeTeam?.id, setUser]);

  // return <span>ciao</span>;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                {activeTeam.image && (
                  <img src={activeTeam.image} className="size-6" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeTeam.name}
                </span>
                {/* <span className="truncate text-xs">{activeTeam.plan}</span> */}
              </div>
              <ChevronsUpDown className="size-4 ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Teams
            </DropdownMenuLabel>
            {members &&
              members.map((member, index) => (
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
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <Link href="/dashboard/account">
                <UserIcon className="size-4" />
                Account
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
