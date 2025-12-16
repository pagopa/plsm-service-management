"use client";

import { useState, useTransition } from "react";
import { addUserToTeam } from "@/lib/actions/team.action";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
};

type Props = {
  availableUsers: User[];
  teamId: string;
};

export default function AddUserToTeamForm({ availableUsers, teamId }: Props) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("member");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Trova l'utente selezionato basato sull'ID
  const selectedUser = availableUsers.find(
    (user: User) => user.id === selectedUserId,
  );

  const handleSubmit = () => {
    if (!selectedUserId || !selectedRole) return;

    startTransition(async () => {
      const res = await addUserToTeam(selectedUserId, teamId, selectedRole);

      if (res.success) {
        toast.success(`${selectedUser?.name} è stato aggiunto al team`, {
          description: "La modifica è stata applicata con successo.",
          duration: 4000,
        });
      } else {
        toast.error(`${selectedUser?.name} non è stato aggiunto al team`, {
          description: "Nessuna modifica è stata applicata.",
          duration: 4000,
        });
      }

      setSelectedUserId("");
      setSelectedRole("member");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-3 max-w-md">
      {availableUsers.length !== 0 && (
        <select
          className="p-2 border rounded"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          disabled={availableUsers.length === 0}
        >
          <option value="">Seleziona utente</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      )}

      {availableUsers.length === 0 && (
        <p className="text-sm text-gray-500">
          Tutti gli utenti sono già nel team
        </p>
      )}

      {availableUsers.length !== 0 && (
        <select
          className="p-2 border rounded"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="member">Membro</option>
          <option value="owner">Proprietario</option>
        </select>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isPending || !selectedUserId || availableUsers.length === 0}
      >
        {isPending ? "Aggiungendo..." : "Aggiungi al team"}
      </Button>
    </div>
  );
}
