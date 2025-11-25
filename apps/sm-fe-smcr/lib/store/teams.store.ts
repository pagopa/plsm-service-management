import {
  FeatureWithPermissions,
  TeamWithPermissions,
} from "@/lib/services/teams.service";
import { create } from "zustand";

type TeamsState = {
  teams: Array<TeamWithPermissions>;
  setTeams: (teams: Array<TeamWithPermissions>) => void;
  features: Array<FeatureWithPermissions>;
  setFeatures: (features: Array<FeatureWithPermissions>) => void;
};

const useTeamsStore = create<TeamsState>()((set) => ({
  teams: [],
  setTeams: (teams) => set(() => ({ teams })),
  features: [],
  setFeatures: (features) => set(() => ({ features })),
}));

export default useTeamsStore;
