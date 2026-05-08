import { UserWithMembers, Member } from "../types/member";
import { Team } from "../types/team";
import { User } from "../types/user";
import { Preferences } from "../types/userProfile";
import { clientEnv } from "@/config/env";
import clientLogger from "@/lib/logger/logger.client";

const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const getUser = async () =>
  /*setUsers: React.Dispatch<React.SetStateAction<(User & { teams: Team[] })[]>>,*/
  {
    try {
      const response = await fetch(`${baseUrl}/api/user/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      void clientLogger.info(
        { info: { event: "user.list.retrieved", metadata: { count: data.length } } },
        "Users retrieved",
      );

      // Aggiungi la proprietà `teams` vuota per ogni utente
      const user = data.map((user: User) => ({
        ...user,
        teams: [] as Team[], // Aggiungi teams vuoto per ogni utente
      }));

      // Imposta lo stato con utenti e la proprietà `teams` vuota
      //setUsers(usersWithTeams);
      return user;
    } catch (error) {
      void clientLogger.error({ error }, "Error retrieving users");
    }
  };

export const getUserTeams = async (
  userId: string,
): Promise<UserWithMembers[]> => {
  try {
    const params = new URLSearchParams();
    params.append("userId", userId);

    const response = await fetch(`${baseUrl}/api/user/teams?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

      const data = await response.json();
      void clientLogger.info(
        { info: { event: "user.teams.retrieved", metadata: { userId } } },
        "Teams for user retrieved from database",
      );
    if (data) return data.teams; // Restituisci i team per l'utente
    return [];
  } catch (error) {
    void clientLogger.error({ error }, "Error retrieving teams for user");
    return []; // Se c'è un errore, restituisci un array vuoto
  }
};

export const getUserMember = async (userId: string): Promise<Member[]> => {
  try {
    const response = await fetch(`${baseUrl}/api/member/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

      const data = await response.json();
      void clientLogger.info(
        { info: { event: "user.members.retrieved", metadata: { userId } } },
        "Members for user retrieved from database",
      );
    if (data) return data; // Restituisci i team per l'utente
    return [];
  } catch (error) {
    void clientLogger.error({ error }, "Error retrieving members for user");
    return []; // Se c'è un errore, restituisci un array vuoto
  }
};

export const getUsers = async () =>
  /*setUserList: React.Dispatch<React.SetStateAction<User[]>>,*/
  {
    try {
      const response = await fetch(`${baseUrl}/api/user/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      // setUserList(data);
      return data;
    } catch (error) {
      void clientLogger.error({ error }, "Error retrieving list of user");
      return []; // Se c'è un errore, restituisci un array vuoto
    }
  };

export const getUserPreferences = async (
  userId: string,
): Promise<Preferences> => {
  try {
    const params = new URLSearchParams();
    params.append("userId", userId);

    const response = await fetch(`${baseUrl}/api/user/preferences?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

      const data = await response.json();
      void clientLogger.info(
        { info: { event: "user.preferences.retrieved", metadata: { userId } } },
        "Preferences for user retrieved from database",
      );
    return data;
  } catch (error) {
    void clientLogger.error(
      { error },
      "Error retrieving preferences for user, apply default",
    );
    return { teamId: null, theme: "light" };
  }
};

export const postUserPreferences = async (
  userId: string,
  preferences: Preferences,
): Promise<boolean> => {
  try {
    const params = new URLSearchParams();
    params.append("userId", userId);

    const response = await fetch(`${baseUrl}/api/user/preferences?${params}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preferences),
    });

    const data = await response.json();
    void clientLogger.info(
      {
        info: {
          event: "user.preferences.saved",
          metadata: { userId, status: response.status, data },
        },
      },
      "Preferences for user saved to database",
    );
    return true;
  } catch (error) {
    void clientLogger.error({ error }, "Error saving preferences for user");
    return false;
  }
};
