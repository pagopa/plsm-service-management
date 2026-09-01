"use client";

import type { TeamWithPermissions } from "@/lib/services/teams.service";
import useTeamsStore from "@/lib/store/teams.store";
import { useEffect } from "react";

type Props = {
  teams: Array<TeamWithPermissions>;
};

export default function TeamsStoreDispatcher({ teams }: Props) {
  const setTeams = useTeamsStore((state) => state.setTeams);

  useEffect(() => {
    setTeams(teams);
  }, [teams, setTeams]);

  return null;
}
