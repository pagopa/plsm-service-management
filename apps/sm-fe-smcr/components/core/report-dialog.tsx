"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reportError } from "@/lib/actions/report.action";
import { LoaderCircleIcon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export default function ReportDialog() {
  const [open, setOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState({
    title: "",
    description: "",
  });
  const [state, action, isPending] = useActionState(reportError, {
    fields: { title: "", description: "" },
  });

  useEffect(() => {
    setDefaultValues({
      title: state.fields.title || "",
      description: state.fields.description || "",
    });

    if (state.fields.title && state.fields.description) {
      if (state.errors?.root) {
        toast.error(state.errors.root);
      } else {
        toast.success("Segnalazione inviata.");
        setOpen(false);
      }
    }
  }, [state]);

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setDefaultValues({ title: "", description: "" });
        setOpen(value);
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" variant="ghost">
          Segnala errore
        </Button>
      </DialogTrigger>

      <DialogContent className="flex flex-col [&>button:last-child]:top-3.5">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base">
            🐞 Segnala un problema
          </DialogTitle>
        </DialogHeader>

        <div className="">
          <form className="space-y-5" action={action}>
            <div className="space-y-4">
              <div className="*:not-first:mt-2">
                <Label htmlFor="title">Dove hai riscontrato l’errore?</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Es. Errore durante il login"
                  defaultValue={defaultValues.title}
                  disabled={isPending}
                />

                {state?.errors?.title && (
                  <Label className="text-destructive">
                    {state.errors?.title}
                  </Label>
                )}
              </div>

              <div className="*:not-first:mt-2">
                <Label htmlFor="description">
                  Descrivi cosa stavi facendo e cosa non ha funzionato
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Es. Ero nella pagina di provisioning e non riuscivo a creare un nuovo servizio…"
                  aria-label="Cosa è successo"
                  defaultValue={defaultValues.description}
                  disabled={isPending}
                />

                {state?.errors?.description && (
                  <Label className="text-destructive">
                    {state.errors?.description}
                  </Label>
                )}
              </div>
            </div>

            <div className="inline-flex gap-2 items-center justify-end w-full">
              <Button size="sm" variant="secondary" type="reset" asChild>
                <DialogClose>Annulla</DialogClose>
              </Button>

              <Button size="sm" type="submit" disabled={isPending}>
                {isPending ? (
                  <LoaderCircleIcon className="size-3.5 opacity-60 animate-spin" />
                ) : (
                  "Invia segnalazione"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
