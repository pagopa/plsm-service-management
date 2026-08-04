"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/context/sessionProvider";

export default function AccountProfilePage() {
  const { user } = useSession();

  if (!user) {
    return <main className="p-6">Nessun utente trovato.</main>;
  }

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Profilo utente</h1>

      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{user.email}</p>
          <p className="text-muted-foreground">
            {user.membersOf.length === 0
              ? "Nessun team assegnato"
              : `${user.membersOf.length} team assegnati`}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
