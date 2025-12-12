"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useSession } from "@/context/sessionProvider";
import { postUserPreferences } from "@/lib/actions/user.action";
import { toast } from "sonner";

export default function AccountProfilePage() {
  const { user, setUser } = useSession();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<
    "light" | "dark" | "system"
  >("system");

  useEffect(() => {
    if (user) {
      console.log("PREFERENZE");
      console.log(user);

      setSelectedTeamId(user.preferences.teamId);
      setSelectedTheme(user.preferences.theme);
    }
  }, [user]);

  const handleUpdatePreferences = () => {
    console.log("Salvataggio preferences:", {
      teamId: selectedTeamId,
      theme: selectedTheme,
    });
    if (user) {
      postUserPreferences(user.id, {
        teamId: selectedTeamId,
        theme: selectedTheme,
      });
      toast.success(`Preferenze salvate`, {
        description: "La modifica è stata applicata con successo.",
        duration: 4000,
      });
    }
    // setUser((u: UserPo) => ({
    //   ...u,
    //   preferences: { ...u.preferences, preferredTeamId: selectedTeamId },
    // }));
  };

  return (
    <main className="p-6 space-y-6">
      {user ? (
        <>
          <h1 className="text-2xl font-bold">Profilo utente</h1>

          <Card>
            <CardContent className="space-y-6">
              <div>
                <Label>Team preferito</Label>
                <Select
                  value={selectedTeamId ?? ""}
                  onValueChange={(v) => setSelectedTeamId(v || null)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleziona team" />
                  </SelectTrigger>
                  <SelectContent>
                    {user.membersOf.map((member) => (
                      <SelectItem key={member.team.id} value={member.team.id}>
                        {member.team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tema visualizzazione</Label>
                <Select
                  value={selectedTheme}
                  onValueChange={(v) => setSelectedTheme(v as any)}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleziona tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Chiaro</SelectItem>
                    <SelectItem value="dark">Scuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdatePreferences} className="mt-2">
                Salva Preferenze
              </Button>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-semibold">Anteprima preferenze</h2>
            <p>
              Team scelto:{" "}
              {user.membersOf.find((t) => t.team.id === user.preferences.teamId)
                ?.team.name ?? "Nessuno"}
            </p>
            <p>Tema scelto: {user.preferences.theme}</p>
          </section>
        </>
      ) : (
        <h1>No User found</h1>
      )}
    </main>
  );
}
