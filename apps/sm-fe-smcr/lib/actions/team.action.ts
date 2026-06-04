// import { Team } from "../types/team";
import { clientEnv } from "@/config/env";
import clientLogger from "@/lib/logger/logger.client";

const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const getTeams = async () =>
  /*setTeams: React.Dispatch<React.SetStateAction<Team[]>>,*/
  {
    try {
      const response = await fetch(`${baseUrl}/api/teams/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      return data; //setTeams(data);
    } catch (error) {
      void clientLogger.error({ error }, "Error retrieving teams in database");
    }
  };

export const getTeamById = async (teamId: string) => {
  try {
    const response = await fetch(`${baseUrl}/api/teams/${teamId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // opzionale: se vuoi evitare caching
    });

    const data = await response.json();
    return data;
  } catch (error) {
    void clientLogger.error({ error }, "Error retrieving team in database");
  }
};

export const getTeamMembers = async (teamId: string) => {
  try {
    const response = await fetch(`${baseUrl}/api/teams/${teamId}/members`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data; //setTeams(data);
  } catch (error) {
    void clientLogger.error(
      { error },
      "Error retrieving member in team in database",
    );
  }
};

// Chiama l'API per rimuovere un membro
export async function removeUserFromTeam(memberId: string, teamId: string) {
  try {
   
    const res = await fetch(`${baseUrl}/api/teams/${teamId}/remove-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });

    const res1 = await res.json();
    void clientLogger.info(
      {
        info: {
          event: "team.member.removed",
          metadata: { memberId, teamId, result: res1 },
        },
      },
      "User removed from team",
    );
    return res1;
  } catch (err) {
    void clientLogger.error({ error: err }, "Errore nella fetch removeUserFromTeam");
    return { error: "Errore di rete" };
  }
}

// Chiama l'API per rimuovere un team
export async function deleteTeam(teamId: string) {
  try {
    const res = await fetch(`${baseUrl}/api/teams/${teamId}/delete`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return await res.json();
  } catch (err) {
    void clientLogger.error({ error: err }, "Errore nella fetch removeTeam");
    return { error: "Errore di rete" };
  }
}

// Chiama l'API per aggiornare il ruolo
export async function updateUserRoleInTeam(
  memberId: string,
  teamId: string,
  role: "owner" | "member",
) {
  try {
    const res = await fetch(`${baseUrl}/api/teams/${teamId}/update-role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role }),
    });

    return await res.json();
  } catch (err) {
    void clientLogger.error(
      { error: err },
      "Errore nella fetch updateUserRoleInTeam",
    );
    return { error: "Errore di rete" };
  }
}

// export async function addUserToTeam(userId: string, teamId: string) {
//   try {
//     const response = await fetch(`/api/teams/${teamId}/add-user`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         userId
//       }),
//     });

//     const data = await response.json();
//   } catch (error) {
//   }
// }
export async function addUserToTeam(
  userId: string,
  teamId: string,
  role: "owner" | "member" | string,
) {
  try {
    const res = await fetch(`${baseUrl}/api/teams/${teamId}/add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    void clientLogger.error({ error: err }, "Errore aggiunta utente");
  }
}
