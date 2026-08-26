"use client";

import { LoaderCircleIcon, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreateTeamResponse = {
  data?: Array<{ id?: number | string }>;
};

export function CreateTeamDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/teams/new", {
        body: new FormData(event.currentTarget),
        method: "POST",
      });
      const result = (await response
        .json()
        .catch(() => null)) as CreateTeamResponse | null;

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Inserisci un nome team di almeno 2 caratteri.");
        }

        if (response.status === 401) {
          throw new Error("La sessione non è valida. Accedi di nuovo e riprova.");
        }

        throw new Error("Non è stato possibile creare il team. Riprova.");
      }

      const teamId = result?.data?.[0]?.id;

      if (!teamId) {
        throw new Error("Il team è stato creato ma non è possibile aprirlo.");
      }

      router.push(`/dashboard/teams/${teamId}`);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Non è stato possibile creare il team. Riprova.",
      );
    } finally {
      setIsSubmitting(false);
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
            Crea team
          </button>
        </DialogTrigger>
      </div>

      <DialogContent
        className="sm:max-w-[480px]"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Crea team</DialogTitle>
          <DialogDescription>
            Inserisci le informazioni del nuovo team.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={handleSubmit}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-team-name">Nome</FieldLabel>
              <Input
                id="create-team-name"
                name="name"
                placeholder="Es. Service management"
                required
                disabled={isSubmitting}
                minLength={2}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-team-description">
                Descrizione
              </FieldLabel>
              <Textarea
                id="create-team-description"
                name="description"
                placeholder="Descrivi lo scopo del team"
                rows={3}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-team-department">Reparto</FieldLabel>
              <Input
                id="create-team-department"
                name="department"
                placeholder="Es. SM"
                disabled={isSubmitting}
              />
            </Field>
          </FieldGroup>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Creazione in corso…
                </>
              ) : (
                "Crea team"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
