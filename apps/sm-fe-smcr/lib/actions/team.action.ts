// import { Team } from "../types/team";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // fallback in dev

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
      // console.log("Teams exist in database:", data);
      return data; //setTeams(data);
    } catch (error) {
      console.error("Error retrieving teams in database:", error);
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
    console.error("Error retrieving team in database:", error);
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
    console.error("Error retrieving member in team in database:", error);
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
    console.log(res1);
    return res1;
  } catch (err) {
    console.error("Errore nella fetch removeUserFromTeam", err);
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
    console.error("Errore nella fetch removeTeam", err);
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
    console.error("Errore nella fetch updateUserRoleInTeam", err);
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
//     console.log("Teams add:", data);
//   } catch (error) {
//     console.error("Error add team to user:", error);
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
    console.error("Errore aggiunta utente:", err);
  }
}
