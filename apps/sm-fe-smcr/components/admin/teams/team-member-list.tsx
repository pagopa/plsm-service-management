"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  removeUserFromTeam,
  updateUserRoleInTeam,
} from "@/lib/actions/team.action";
import { TEAM_ROLES } from "@/lib/costants";
import Image from "next/image";
import { Button } from "@repo/ui";
import { toast } from "sonner";

type Member = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "owner" | "member";
};

type Props = {
  teamId: string;
  members: Member[];
  onUpdate?: () => void; // Per ricaricare dopo una modifica
};

export default function TeamMemberList({ teamId, members, onUpdate }: Props) {
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const getRoleLabel = (role: "owner" | "member") => {
    return role === "owner" ? "Proprietario" : "Membro";
  };

  const handleRemove = (memberId: string, userName: string) => {
    setLoading(memberId);
    startTransition(async () => {
      try {
        await removeUserFromTeam(memberId, teamId);

        // Toast di successo
        toast.success(`${userName} è stato rimosso dal team`, {
          description: "La modifica è stata applicata con successo.",
          duration: 4000,
        });

        // Refresh della pagina
        router.refresh();

        // Callback opzionale per il componente padre
        onUpdate?.();
      } catch (error) {
        // Toast di errore
        toast.error("Errore durante la rimozione", {
          description: "Si è verificato un problema. Riprova più tardi.",
          duration: 4000,
        });
        console.error("Errore rimozione utente:", error);
      } finally {
        setLoading(null);
      }
    });
  };

  const handleRoleChange = (
    memberId: string,
    newRole: "owner" | "member",
    userName: string,
  ) => {
    setLoading(memberId);
    startTransition(async () => {
      try {
        await updateUserRoleInTeam(memberId, teamId, newRole);

        // Toast di successo
        const roleText = newRole === "owner" ? "Proprietario" : "Membro";
        toast.success(`Ruolo di ${userName} aggiornato`, {
          description: `Il nuovo ruolo è: ${roleText}`,
          duration: 4000,
        });

        // Refresh della pagina
        router.refresh();

        // Callback opzionale per il componente padre
        onUpdate?.();
      } catch (error) {
        // Toast di errore
        toast.error("Errore durante l'aggiornamento del ruolo", {
          description: "Si è verificato un problema. Riprova più tardi.",
          duration: 4000,
        });
        console.error("Errore aggiornamento ruolo:", error);
      } finally {
        setLoading(null);
      }
    });
  };

  return (
    
    <div className="space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white"
        >
          <div className="flex items-center gap-3">
            {member.image ? (
              <Image
                src={member.image}
                alt={member.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {member.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{member.name}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={member.role || "member"}
              onChange={(e) =>
                handleRoleChange(
                  member.id,
                  e.target.value as "owner" | "member",
                  member.name,
                )
              }
              disabled={isPending && loading === member.id}
              className="border rounded px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {TEAM_ROLES.map((role) => (
                <option key={role} value={role}>
                  {getRoleLabel(role)}
                </option>
              ))}
            </select>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemove(member.id, member.name)}
              disabled={isPending && loading === member.id}
            >
              {isPending && loading === member.id
                ? "Rimuovendo..."
                : "Rimuovi"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
