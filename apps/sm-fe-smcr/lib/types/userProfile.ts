import { Member } from "./member";
import { Team } from "./team";

// Tipi per la sessione personalizzata
// export interface UserProfile {
//   id: string;
//   email: string;
//   name: string;
//   membersOf: Array<Member>;
//   activeTeam: Team | null;
// role: string;
// department: string;
// permissions: string[];
// Altri campi dal tuo DB
// lastLogin?: Date;
// preferences?: Record<string, any>;
// }

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
