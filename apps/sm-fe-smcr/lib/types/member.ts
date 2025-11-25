import { Team } from "./team";
import { User } from "./user";

export type Member = {
  id: string;
  // teamId: string;
  userId: string;
  role: "owner" | "member";
  createdAt: string;
  // user: User;
  team: Team;
};

export type TeamWithMembers = Team & {
  members: Member[];
};

export type UserWithMembers = User & {
  members: Member[];
};
