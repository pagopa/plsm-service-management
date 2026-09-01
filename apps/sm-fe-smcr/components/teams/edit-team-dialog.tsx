"use client";

import { LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type EditTeamDialogProps = {
  department: string | null;
  description: string | null;
  name: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  teamId: number;
};

export function EditTeamDialog({
  department,
  description,
  name,
  onOpenChange,
  open,
  teamId,
}: EditTeamDialogProps) {
  const router = useRouter();
  const [currentDepartment, setCurrentDepartment] = useState(department ?? "");
  const [currentDescription, setCurrentDescription] = useState(
    description ?? "",
  );
  const [currentName, setCurrentName] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrentDepartment(department ?? "");
    setCurrentDescription(description ?? "");
    setCurrentName(name);
    setError(null);
  }, [department, description, name, open]);

  function handleOpenChange(nextOpen: boolean) {
    if (!isSubmitting) {
      onOpenChange(nextOpen);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        body: JSON.stringify({
          department: currentDepartment,
          description: currentDescription,
          name: currentName,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile modificare il team.",
        );
      }

      onOpenChange(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Non è stato possibile modificare il team.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-[480px]"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Modifica team</DialogTitle>
          <DialogDescription>
            Aggiorna le informazioni visibili del team.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-team-name">Nome</FieldLabel>
              <Input
                id="edit-team-name"
                value={currentName}
                onChange={(event) => setCurrentName(event.target.value)}
                required
                disabled={isSubmitting}
                minLength={2}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-team-description">
                Descrizione
              </FieldLabel>
              <Textarea
                id="edit-team-description"
                value={currentDescription}
                onChange={(event) => setCurrentDescription(event.target.value)}
                rows={3}
                disabled={isSubmitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="edit-team-department">Reparto</FieldLabel>
              <Input
                id="edit-team-department"
                value={currentDepartment}
                onChange={(event) => setCurrentDepartment(event.target.value)}
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
                  Salvataggio in corso…
                </>
              ) : (
                "Salva modifiche"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
