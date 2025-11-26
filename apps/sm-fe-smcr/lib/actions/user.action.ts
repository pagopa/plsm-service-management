import { UserWithMembers, Member } from "../types/member";
import { Team } from "../types/team";
import { User } from "../types/user";
import { Preferences } from "../types/userProfile";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // fallback in dev

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
      console.log("Users retrieved:", data);

      // Aggiungi la proprietà `teams` vuota per ogni utente
      const user = data.map((user: User) => ({
        ...user,
        teams: [] as Team[], // Aggiungi teams vuoto per ogni utente
      }));

      // Imposta lo stato con utenti e la proprietà `teams` vuota
      //setUsers(usersWithTeams);
      return user;
    } catch (error) {
      console.error("Error retrieving users:", error);
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
    console.log("Teams for user retrieved from database:", data);
    if (data) return data.teams; // Restituisci i team per l'utente
    return [];
  } catch (error) {
    console.error("Error retrieving teams for user:", error);
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
    console.log("Members for user retrieved from database:", data);
    if (data) return data; // Restituisci i team per l'utente
    return [];
  } catch (error) {
    console.error("Error retrieving members for user:", error);
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
      // console.log("List of users retrieved from database:", data);
      // setUserList(data);
      return data;
    } catch (error) {
      console.error("Error retrieving list of user:", error);
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
    console.log("Preferences for user retrieved from database:", data);
    return data;
  } catch (error) {
    console.error(
      "Error retrieving preferences for user, apply default:",
      error,
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
    console.log("Preferences for user saved to database:", data);
    return true;
  } catch (error) {
    console.error("Error saving preferences for user:", error);
    return false;
  }
};
