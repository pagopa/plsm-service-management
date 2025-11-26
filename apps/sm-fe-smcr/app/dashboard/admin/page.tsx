"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";

export default function AdminDashboardPage() {
  const router = useRouter();

  const handleTeamCardClick = () => {
    router.push("/dashboard/admin/teams");
  };

  return (
    <main className="p-6 space-y-6">
      <nav className="text-sm text-muted-foreground mb-4">
        <span
          className="text-muted-foreground hover:underline cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          Admin
        </span>{" "}
      </nav>

      <h1 className="text-3xl font-bold">Pannello di Amministrazione</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card che naviga alla pagina di gestione team */}
        <Card
          onClick={handleTeamCardClick}
          className="cursor-pointer hover:shadow-lg transition-all"
        >
          <CardHeader>
            <CardTitle>Gestione Team</CardTitle>
          </CardHeader>
          <CardContent>
            Visualizza e modifica i team esistenti, aggiungi membri, ruoli, ecc.
          </CardContent>
        </Card>

        {/* Altre card amministrative */}
        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Gestione Utenti</CardTitle>
          </CardHeader>
          <CardContent>Aggiungi o modifica gli utenti registrati.</CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-all">
          <CardHeader>
            <CardTitle>Gestione Log</CardTitle>
          </CardHeader>
          <CardContent>Visualizza log.</CardContent>
        </Card>
      </div>
    </main>
  );
}
