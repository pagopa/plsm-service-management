import { create } from "zustand";
import { MemberWithTeams } from "@/lib/services/members.service";

type AuthState = {
  email: string | null;
  setEmail: (email: string) => void;
  user: MemberWithTeams | null;
  setUser: (user: MemberWithTeams | null) => void;
};

const useAuthStore = create<AuthState>()((set) => ({
  email: null,
  setEmail: (email: string) => set(() => ({ email })),
  user: null,
  setUser: (user) => set({ user }),
}));

export default useAuthStore;
