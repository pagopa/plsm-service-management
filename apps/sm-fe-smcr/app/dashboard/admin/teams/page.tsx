"use client";
import CreateTeam from "@/components/admin/teams/create-team";
import TeamList from "@/components/admin/teams/team-list";
import { useRouter } from "next/navigation";

export default function TeamsPage() {
  const router = useRouter();

  return (
    <main className="p-6">
      <nav className="text-sm text-muted-foreground mb-4">
        <span
          className="text-muted-foreground hover:underline cursor-pointer"
          onClick={() => router.push("/dashboard/admin")}
        >
          Admin
        </span>{" "}
        / Gestione Team
      </nav>

      <h1 className="text-2xl font-bold mb-4">Tutti i Team</h1>
      <CreateTeam />
      <TeamList />
    </main>
  );
}
