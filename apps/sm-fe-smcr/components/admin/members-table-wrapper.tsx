"use client";

import { updateTeam } from "@/actions/admin";
import { Team } from "@/lib/types/team";
import { User } from "@/lib/types/user";
import { getColumns, MembersTable } from "@/components/provisioning/members";
import React from "react";

type Props = {
  teams: Array<Team>;
  users: Array<User & { teams: Team[] }>;
};

export default function MembersTableWrapper({ teams, users }: Props) {
  return (
    <MembersTable
      columns={getColumns(teams, updateTeam as any) as any}
      data={users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        teams: user.teams,
      }))}
    />
  );
}
