"use client";

import {
  FeatureWithPermissions,
  TeamWithPermissions,
} from "@/lib/services/teams.service";
import useTeamsStore from "@/lib/store/teams.store";
import { useEffect } from "react";

type Props = {
  teams: Array<TeamWithPermissions>;
  features: Array<FeatureWithPermissions>;
};

export default function TeamsStoreDispatcher({ teams, features }: Props) {
  const setTeams = useTeamsStore((state) => state.setTeams);
  const setFeatures = useTeamsStore((state) => state.setFeatures);

  useEffect(() => {
    setTeams(teams);
  }, [teams, setTeams]);

  useEffect(() => {
    setFeatures(features);
  }, [features, setFeatures]);

  return null;
}
