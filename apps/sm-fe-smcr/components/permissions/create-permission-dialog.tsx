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

type CreatePermissionResponse = {
  error?: string;
};

export function CreatePermissionDialog() {
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
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/permissions", {
        body: JSON.stringify({
          code: formData.get("code"),
          description: formData.get("description"),
          name: formData.get("name"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response
        .json()
        .catch(() => null)) as CreatePermissionResponse | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile creare il permesso. Riprova.",
        );
      }

      event.currentTarget.reset();
      setOpen(false);
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Non è stato possibile creare il permesso. Riprova.",
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
            Crea permesso
          </button>
        </DialogTrigger>
      </div>

      <DialogContent
        className="sm:max-w-[480px]"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader>
          <DialogTitle>Crea permesso</DialogTitle>
          <DialogDescription>
            Definisci il permesso che potrà essere assegnato ai team.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-permission-name">Nome</FieldLabel>
              <Input
                id="create-permission-name"
                name="name"
                placeholder="Es. Visualizza Overview"
                required
                disabled={isSubmitting}
                minLength={2}
                maxLength={100}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-permission-code">Codice</FieldLabel>
              <Input
                id="create-permission-code"
                name="code"
                placeholder="Es. overview.read"
                required
                disabled={isSubmitting}
                minLength={3}
                maxLength={100}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-permission-description">
                Descrizione
              </FieldLabel>
              <Textarea
                id="create-permission-description"
                name="description"
                placeholder="Descrivi cosa abilita questo permesso"
                rows={3}
                disabled={isSubmitting}
                maxLength={500}
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
                "Crea permesso"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
