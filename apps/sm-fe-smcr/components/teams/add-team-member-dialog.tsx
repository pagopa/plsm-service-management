"use client";

import { LoaderCircleIcon, Plus, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Member = {
  email: string;
  id: string;
  name: string;
};

type TeamMember = {
  email: string;
  firstname: string;
  id: number;
  lastname: string;
};

type AddTeamMemberDialogProps = {
  members: TeamMember[];
  teamId: number;
  teamName: string;
};

function isMember(value: unknown): value is Member {
  if (!value || typeof value !== "object") {
    return false;
  }

  const member = value as Record<string, unknown>;

  return (
    typeof member.email === "string" &&
    typeof member.id === "string" &&
    typeof member.name === "string"
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export function AddTeamMemberDialog({
  members: assignedMembers,
  teamId,
  teamName,
}: AddTeamMemberDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

  const assignedMemberIds = new Set(assignedMembers.map((member) => member.id));
  const matchingMembers = members.filter(
    (member) =>
      !assignedMemberIds.has(Number(member.id)) &&
      member.email.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function loadMembers() {
    setError(null);
    setIsLoadingMembers(true);

    try {
      const response = await fetch("/api/user/list");
      const result = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !Array.isArray(result)) {
        throw new Error("Non è possibile caricare gli utenti disponibili.");
      }

      setMembers(result.filter(isMember));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Non è possibile caricare gli utenti disponibili.",
      );
    } finally {
      setIsLoadingMembers(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (nextOpen) {
      setQuery("");
      void loadMembers();
      return;
    }

    setError(null);
  }

  async function addMember(memberId: string) {
    const parsedMemberId = Number(memberId);

    if (!Number.isInteger(parsedMemberId) || parsedMemberId <= 0) {
      setError("L'utente selezionato non è valido.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setPendingMemberId(memberId);

    try {
      const response = await fetch(`/api/teams/${teamId}/add-user`, {
        body: JSON.stringify({ userId: parsedMemberId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Non è stato possibile aggiungere l'utente. Riprova.");
      }

      setOpen(false);
      setQuery("");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Non è stato possibile aggiungere l'utente. Riprova.",
      );
    } finally {
      setIsSubmitting(false);
      setPendingMemberId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="w-full px-2 sm:px-4">
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-xs font-medium text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Plus className="size-3" strokeWidth={1.75} />
            Aggiungi utente
          </button>
        </DialogTrigger>
      </div>

      <DialogContent
        className="gap-4 rounded-2xl p-6 sm:max-w-[512px]"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader className="pr-6">
          <div className="flex items-baseline gap-2">
            <DialogTitle className="text-base font-medium">
              Aggiungi utente
            </DialogTitle>
            <span className="truncate text-xs text-neutral-500">{teamName}</span>
          </div>
          <DialogDescription className="sr-only">
            Cerca un utente tramite email e aggiungilo al team {teamName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 text-neutral-500"
            />
            <Input
              aria-label="Cerca tramite email"
              className="rounded-xl border-neutral-100 bg-neutral-50 pl-8 shadow-none"
              disabled={isSubmitting}
              placeholder="Cerca tramite email..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {query.trim() ? (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-neutral-500">Utenti disponibili</p>
              {isLoadingMembers ? (
                <div className="flex items-center gap-2 py-1 text-sm text-neutral-500">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Caricamento utenti…
                </div>
              ) : matchingMembers.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {matchingMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      aria-busy={pendingMemberId === member.id}
                      disabled={isSubmitting}
                      onClick={() => void addMember(member.id)}
                      className="flex w-full items-center gap-2 rounded-md text-left transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {pendingMemberId === member.id ? (
                        <LoaderCircleIcon className="size-4 shrink-0 animate-spin text-neutral-500" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="flex size-4 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-100 text-[8px] font-medium uppercase text-neutral-600"
                        >
                          {getInitials(member.name)}
                        </span>
                      )}
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="shrink-0 text-sm text-black">{member.name}</span>
                        <span className="truncate text-xs text-neutral-500">
                          {member.email}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-1 text-sm text-neutral-500">
                  Nessun utente disponibile con questa email.
                </p>
              )}
            </section>
          ) : (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-neutral-500">Utenti già aggiunti</p>
              {assignedMembers.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {assignedMembers.map((member) => {
                    const name = `${member.firstname} ${member.lastname}`;

                    return (
                      <div key={member.id} className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="flex size-4 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-100 text-[8px] font-medium uppercase text-neutral-600"
                        >
                          {getInitials(name)}
                        </span>
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="shrink-0 text-sm text-black">{name}</span>
                          <span className="truncate text-xs text-neutral-500">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-1 text-sm text-neutral-500">
                  Nessun utente è stato ancora aggiunto.
                </p>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
