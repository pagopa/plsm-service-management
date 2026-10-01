import { Member } from "./member";
import { Team } from "./team";

export type ThemePreference = "light" | "dark" | "system";
export interface Preferences {
  teamId: string | null; // ora è il `team.id`
  theme: ThemePreference;
}
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  membersOf: Array<Member>;
  activeTeam: Team | null;
  preferences: Preferences;
}
