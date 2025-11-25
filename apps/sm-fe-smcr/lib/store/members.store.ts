import { MemberWithTeams } from "@/lib/services/members.service";
import { create } from "zustand";

type MembersState = {
  members: Array<MemberWithTeams>;
  setMembers: (members: Array<MemberWithTeams>) => void;
};

const useMembersStore = create<MembersState>()((set) => ({
  members: [],
  setMembers: (members) =>
    set(() => ({
      members,
    })),
}));

export default useMembersStore;
