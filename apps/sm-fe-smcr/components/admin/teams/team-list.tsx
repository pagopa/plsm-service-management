"use client";
import DefaultTeamIcon from "@/components/icons/defaultTeamIcon";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getTeams } from "@/lib/actions/team.action";
import { Team } from "@/lib/types/team";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  if (loading) {
    return <div className="p-4">Caricamento team...</div>;
  }

  if (teams.length === 0) {
    return <div className="p-4">Nessun team trovato.</div>;
  }

  // Separate the Admin team from the rest
  const adminTeam = teams.find((team) => team.name === "Admin");
  const otherTeams = teams.filter((team) => team.name !== "Admin");

  return (
    <div className="p-4">
      {adminTeam && (
        <div className="mb-4">
          <Card
            key={adminTeam.id}
            className="flex flex-col justify-between border-4 bg-cyan-100 border-amber-600 rounded-lg"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {adminTeam.image ? (
                  <Image
                    src={adminTeam.image}
                    alt={adminTeam.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <DefaultTeamIcon className="w-12 h-12 text-muted-foreground" />
                )}
                {adminTeam.name} <span style={{ color: "#FFD700" }}>★</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-end">
              <div className="text-sm text-muted-foreground">
                Creato il:{" "}
                {new Date(adminTeam.createdAt).toLocaleDateString("it-IT")}
              </div>
              <Link href={`/dashboard/admin/teams/${adminTeam.id}`}>
                <Button size="sm" variant="secondary">
                  Gestisci
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {otherTeams.map((team) => (
          <Card key={team.id} className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {team.image ? (
                  <Image
                    src={team.image}
                    alt={team.name}
                    width={48}
                    height={48}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <DefaultTeamIcon className="w-12 h-12 text-muted-foreground" />
                )}
                {team.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-between items-end">
              <div className="text-sm text-muted-foreground">
                Creato il:{" "}
                {new Date(team.createdAt).toLocaleDateString("it-IT")}
              </div>
              <Link href={`/dashboard/admin/teams/${team.id}`}>
                <Button size="sm" variant="secondary">
                  Gestisci
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
