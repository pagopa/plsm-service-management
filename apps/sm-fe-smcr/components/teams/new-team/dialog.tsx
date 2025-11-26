"use client";

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { createTeamAction } from "@/lib/actions/teams.action";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import slugify from "slugify";
import { toast } from "sonner";

export function NewTeamDialog() {
  const [state, action, isPending] = useActionState(createTeamAction, {
    data: {
      name: "",
      icon: "",
    },
    error: null,
  });
  const [open, setOpen] = useState(false);
  const [slug, setSlug] = useState(slugify(state.data.name || ""));

  useEffect(() => {
    if (state.data.name && state.error === null) {
      setOpen(false);
      toast.success(
        `Il team ${state.data.name} è stato aggiunto con successo!`,
      );
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <PlusIcon className="size-3.5 opacity-60" />
          <span>Crea Team</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuovo Team</DialogTitle>
          <DialogDescription>
            Dai un nome al tuo team e aggiungi un’icona per riconoscerlo
            facilmente.
          </DialogDescription>
        </DialogHeader>

        <form action={action}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  autoComplete="off"
                  placeholder="Service Management"
                  onChange={(event) => {
                    const value = event.target.value;
                    setSlug(
                      slugify(value, {
                        lower: true,
                      }),
                    );
                  }}
                />
                <FieldDescription>
                  Usa un nome breve e riconoscibile. Sarà visibile ai membri.
                </FieldDescription>

                {state.error?.name && (
                  <FieldError>{state.error.name}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  autoComplete="off"
                  placeholder="service-management"
                  value={slug}
                  readOnly
                />
                <FieldDescription>
                  Usa un nome breve e riconoscibile. Sarà visibile ai membri.
                </FieldDescription>

                {state.error?.slug && (
                  <FieldError>{state.error.slug}</FieldError>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="icon">Icona</FieldLabel>
                <Input id="icon" name="icon" autoComplete="off" />

                <FieldDescription>
                  PNG/SVG quadrata, min 128×128. Puoi cambiarla in seguito.
                </FieldDescription>

                {state.error?.icon && (
                  <FieldError>{state.error.icon}</FieldError>
                )}
              </Field>

              {state.error?.root && <FieldError>{state.error.root}</FieldError>}
            </FieldGroup>
          </FieldSet>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annulla</Button>
            </DialogClose>

            <Button type="submit">
              {isPending ? <Spinner /> : <CheckIcon />}
              <span>Salva</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
