// app/dashboard/admin/teams/[teamId]/page.tsx
import {
  getTeamById,
  getTeamMembers,
  deleteTeam,
} from "@/lib/actions/team.action";
import { getUsers } from "@/lib/actions/user.action";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import DefaultTeamIcon from "@/components/icons/defaultTeamIcon";
import AddUserToTeamForm from "@/components/admin/teams/add-user-to-team-form";
import TeamMemberList from "@/components/admin/teams/team-member-list";
import { User } from "@/lib/types/user";
import { Member } from "@/lib/types/member";
import { Button } from "@/components/ui/button";
import UpdateTeamImage from "@/components/admin/teams/update-team-image";
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; // fallback in dev

type Props = {
  params: Promise<{ teamId: string }>;
};

export default async function TeamDetailPage({ params }: Props) {
  const { teamId } = await params;

  const team = await getTeamById(teamId);
  if (!team) return notFound();

  const members = await getTeamMembers(teamId);
  const allUsers = await getUsers();

  const availableUsers = allUsers.filter(
    (user: User) =>
      !members.some((member: Member) => member.userId === user.id),
  );
  // console.log("Members", members);
  // console.log("allUsers", allUsers);
  // console.log("availableUsers", availableUsers);

  async function handleDeleteTeam() {
    "use server";
    try {
      await deleteTeam(teamId);
      redirect(`${baseUrl}/dashboard/admin/teams`);
    } catch (error) {
      console.error("Errore durante l'eliminazione del team:", error);
      throw error;
    }
  }

  return (
    <main className="p-6 max-w-4xl mx-auto">
      <section className="flex items-center gap-4 mb-6">
        {team.image ? (
          <Image
            src={team.image}
            alt={team.name}
            width={64}
            height={64}
            className="rounded-md object-cover"
          />
        ) : (
          <DefaultTeamIcon className="w-16 h-16 text-muted-foreground" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{team.name}</h1>
          <p className="text-sm text-muted-foreground">
            Creato il {new Date(team.createdAt).toLocaleDateString()}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Membri del team</h2>
        <TeamMemberList teamId={teamId} members={members} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Aggiungi membro</h2>
        <AddUserToTeamForm teamId={teamId} availableUsers={availableUsers} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">
          Aggiorna immagine del team
        </h2>
        <UpdateTeamImage teamId={teamId} />
      </section>

      {team.name !== "Admin" && (
        <section className="mt-10 border-t pt-6">
          <h2 className="text-lg font-semibold mb-4 text-destructive">
            Area pericolosa
          </h2>
          <div className="p-4 border border-destructive rounded-lg">
            <h3 className="font-medium mb-2">Elimina team</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Questa azione è irreversibile. Tutti i membri verranno rimossi dal
              team.
            </p>
            <form action={handleDeleteTeam}>
              <Button type="submit" variant="destructive" size="sm">
                Elimina team
              </Button>
            </form>
          </div>
        </section>
      )}
    </main>
  );
}
