"use client";

import { useState, useTransition } from "react";
import { addUserToTeam } from "@/lib/actions/team.action";
import { Button } from "@/components/ui/button";

type User = {
  id: string;
  name: string;
  email: string;
};

type Team = {
  id: string;
  name: string;
};

type AddUserToTeamProps = {
  users: User[];
  teams: Team[];
};

export default function AddUserToTeam({ users, teams }: AddUserToTeamProps) {
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedRole, setSelectedRole] = useState<"member" | "owner">(
    "member",
  );
  const [isPending, startTransition] = useTransition();

  const handleAdd = () => {
    if (!selectedUser || !selectedTeam) return;

    startTransition(() => {
      addUserToTeam(selectedUser, selectedTeam, selectedRole).then(() => {
        alert("Utente aggiunto al team!");
        setSelectedUser("");
        setSelectedTeam("");
        setSelectedRole("member");
      });
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 px-4">
      <select
        onChange={(e) => setSelectedUser(e.target.value)}
        value={selectedUser}
        className="p-2 border rounded"
      >
        <option value="">Seleziona utente</option>
        {users.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name} ({u.email})
          </option>
        ))}
      </select>

      <select
        onChange={(e) => setSelectedTeam(e.target.value)}
        value={selectedTeam}
        className="p-2 border rounded"
      >
        <option value="">Seleziona team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        onChange={(e) => setSelectedRole(e.target.value as "member" | "owner")}
        value={selectedRole}
        className="p-2 border rounded"
      >
        <option value="member">Membro</option>
        <option value="owner">Proprietario</option>
      </select>

      <Button onClick={handleAdd} disabled={isPending}>
        {isPending ? "Aggiungendo..." : "Aggiungi"}
      </Button>
    </div>
  );
}
