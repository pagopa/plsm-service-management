import type { TeamWithPermissions } from "@/lib/services/teams.service";
import { create } from "zustand";

type TeamsState = {
  teams: Array<TeamWithPermissions>;
  setTeams: (teams: Array<TeamWithPermissions>) => void;
};

const useTeamsStore = create<TeamsState>()((set) => ({
  teams: [],
  setTeams: (teams) => set(() => ({ teams })),
}));

export default useTeamsStore;
