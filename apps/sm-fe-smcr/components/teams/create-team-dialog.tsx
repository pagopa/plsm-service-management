"use client";

import { Plus } from "lucide-react";
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

export function CreateTeamDialog() {
  return (
    <Dialog>
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

      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crea team</DialogTitle>
          <DialogDescription>
            Inserisci le informazioni del nuovo team.
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => event.preventDefault()}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="create-team-name">Nome</FieldLabel>
              <Input
                id="create-team-name"
                name="name"
                placeholder="Es. Service management"
                required
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
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="create-team-department">Reparto</FieldLabel>
              <Input
                id="create-team-department"
                name="department"
                placeholder="Es. SM"
              />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Annulla
              </Button>
            </DialogClose>
            <Button type="submit">Crea team</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
