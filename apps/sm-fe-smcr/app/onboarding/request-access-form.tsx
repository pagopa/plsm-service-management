"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2Icon,
  Clock3Icon,
  LifeBuoyIcon,
  MailCheckIcon,
  ShieldCheckIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import logoPagoPa from "public/logo_4.svg";

const OTHER_TEAM_VALUE = "other";

const requestFlow = [
  {
    title: "Invio richiesta",
    description: "Compila il form con team e motivazione.",
    icon: MailCheckIcon,
  },
  {
    title: "Verifica amministratore",
    description: "Un admin del team prende in carico la richiesta.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Abilitazione accesso",
    description: "Dopo l'approvazione, entrerai automaticamente in dashboard.",
    icon: CheckCircle2Icon,
  },
] as const;

export type TeamSelectOption = {
  value: string;
  label: string;
};

type RequestAccessFormProps = {
  teamOptions: TeamSelectOption[];
};

function createTicketId() {
  const timestamp = Date.now().toString().slice(-6);
  return `REQ-${new Date().getFullYear()}-${timestamp}`;
}

export default function RequestAccessForm({
  teamOptions,
}: RequestAccessFormProps) {
  const [selectedTeam, setSelectedTeam] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  const canSubmit = selectedTeam.length > 0 && reason.trim().length >= 20;

  const selectedTeamLabel = useMemo(() => {
    if (selectedTeam === OTHER_TEAM_VALUE) {
      return "Altro";
    }

    return teamOptions.find((team) => team.value === selectedTeam)?.label ?? "";
  }, [selectedTeam, teamOptions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setTicketId(createTicketId());
    setIsSubmitting(false);
  }

  function handleReset() {
    setTicketId(null);
    setSelectedTeam("");
    setReason("");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#dff3ef] via-[#eef7f4] to-white">
      <div className="pointer-events-none absolute -top-32 left-0 h-72 w-72 rounded-full bg-[#00a1b0]/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[#97d1d8]/35 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-6 px-4 py-10 md:px-8 md:py-14 lg:grid lg:grid-cols-[1.08fr_1fr] lg:items-start lg:gap-10">
        <section className="h-fit rounded-2xl border border-white/60 bg-white/55 p-6 shadow-sm backdrop-blur md:p-8 lg:self-start">
          <div className="mb-8 flex items-center gap-3">
            <Image
              src={logoPagoPa.src}
              width={118}
              height={28}
              alt="Logo PagoPA"
            />
            <Badge className="bg-[#004b5f] text-white">SMCR Access</Badge>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-[#08323d] md:text-4xl">
            Accesso in attesa
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[#33525a] md:text-base">
            Il tuo account è stato autenticato correttamente, ma non appartieni
            ancora a nessun team. Invia una richiesta di accesso per iniziare a
            lavorare in Service Management Control Room.
          </p>

          <div className="mt-8 space-y-3">
            {requestFlow.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-3 rounded-xl border border-[#d3e8e4] bg-white/80 p-4"
              >
                <div className="mt-0.5 rounded-lg bg-[#e6f4f2] p-2 text-[#007987]">
                  <step.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#12333d]">
                    {step.title}
                  </p>
                  <p className="mt-1 text-sm text-[#4a6770]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <Card className="gap-0 border-[#cfe4e1] bg-white/95 py-0 shadow-xl shadow-[#0b6e7910]">
            <CardHeader className="border-b border-[#e1efec] px-6 py-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Badge
                  variant="outline"
                  className="border-[#9ecfd0] bg-[#edf8f6] text-[#0d4f5e]"
                >
                  Richiesta accesso
                </Badge>
                <div className="inline-flex items-center gap-1 text-xs text-[#59777f]">
                  <Clock3Icon className="size-3.5" />
                  Tempo medio approvazione: 1-2 giorni
                </div>
              </div>
              <CardTitle className="text-xl text-[#12333d]">
                Richiedi accesso a un team
              </CardTitle>
              <CardDescription className="text-[#587179]">
                Compila i campi con le informazioni necessarie per la presa in
                carico.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 px-6 pb-6 pt-4">
              {ticketId ? (
                <div className="space-y-5 rounded-xl border border-green-200 bg-green-50/70 p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2Icon className="mt-0.5 size-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">
                        Richiesta inviata con successo
                      </p>
                      <p className="mt-1 text-sm text-green-800/90">
                        Ticket: <span className="font-mono">{ticketId}</span>
                      </p>
                      <p className="mt-1 text-sm text-green-800/90">
                        Team selezionato: <strong>{selectedTeamLabel}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-green-200 bg-white px-4 py-3 text-sm text-green-900/90">
                    Ti aggiorneremo via email non appena il team amministrativo
                    completa la verifica.
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button onClick={handleReset} variant="outline">
                      Invia un&apos;altra richiesta
                    </Button>
                    <Button asChild variant="pagopaprimary">
                      <Link href="/">Torna alla login</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="team-select">Team richiesto *</Label>
                    <Select
                      value={selectedTeam}
                      onValueChange={setSelectedTeam}
                    >
                      <SelectTrigger id="team-select" className="w-full">
                        <SelectValue placeholder="Seleziona team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teamOptions.map((team) => (
                          <SelectItem key={team.value} value={team.value}>
                            {team.label}
                          </SelectItem>
                        ))}
                        <SelectItem value={OTHER_TEAM_VALUE}>Altro</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedTeam === OTHER_TEAM_VALUE && (
                      <p className="text-xs text-muted-foreground">
                        Hai selezionato Altro: aggiungi i dettagli nella
                        motivazione.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reason">Motivazione *</Label>
                    <Textarea
                      id="reason"
                      rows={4}
                      placeholder="Descrivi brevemente perché ti serve l'accesso a questo team"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Inserisci almeno 20 caratteri ({reason.trim().length}/20)
                    </p>
                  </div>

                  <div className="rounded-lg border border-[#d7e9e6] bg-[#f4fbf9] px-4 py-3 text-sm text-[#32525a]">
                    Se non conosci il team corretto, indica il contesto nella
                    motivazione: il supporto indirizzerà la richiesta al gruppo
                    giusto.
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="submit"
                      variant="pagopaprimary"
                      disabled={!canSubmit || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner />
                          <span>Invio richiesta...</span>
                        </>
                      ) : (
                        <span>Invia richiesta</span>
                      )}
                    </Button>

                    <Button asChild type="button" variant="outline">
                      <Link href="/">Annulla</Link>
                    </Button>
                  </div>
                </form>
              )}

              <div className="flex items-center gap-2 border-t border-[#e6efed] pt-4 text-xs text-muted-foreground">
                <LifeBuoyIcon className="size-3.5" />
                Per urgenze, contatta l&apos;amministratore del tuo dominio.
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
