"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "./date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRODUCT_MAP, Products } from "@/lib/types/product";
import { sendToSlackAction } from "@/lib/actions/call-management.action";
import { useActionState, useEffect, useState } from "react";
import { LoaderCircleIcon, SlackIcon } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";

const getEnvironmentLabel = (target: "test" | "prod") =>
  target === "prod" ? "Produzione" : "Test";

export default function SlackForm() {
  const [state, action, isPending] = useActionState(sendToSlackAction, {
    fields: {
      name: "",
      product: "",
      date: "",
      members: "",
      link: "",
      target: "test",
    },
    target: undefined,
    submittedAt: undefined,
  });
  const [pendingSubmit, setPendingSubmit] = useState<"test" | "prod" | null>(
    null,
  );
  const [lastHandledSubmission, setLastHandledSubmission] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!isPending) {
      setPendingSubmit(null);
    }
  }, [isPending]);

  const handleSubmitClick = (target: "test" | "prod") => () => {
    setPendingSubmit(target);
  };

  const testIsLoading = isPending && pendingSubmit === "test";
  const prodIsLoading = isPending && pendingSubmit === "prod";
  useEffect(() => {
    if (
      isPending ||
      !state.target ||
      !state.submittedAt ||
      lastHandledSubmission === state.submittedAt
    ) {
      return;
    }

    const envLabel = getEnvironmentLabel(state.target);
    if (state.errors?.root) {
      toast.error(`Invio in ${envLabel} non riuscito.`, {
        description: state.errors.root,
      });
    } else if (!state.errors) {
      toast.success(`Messaggio inviato in ${envLabel}.`);
    }

    setLastHandledSubmission(state.submittedAt);
  }, [
    isPending,
    lastHandledSubmission,
    state.errors,
    state.submittedAt,
    state.target,
  ]);

  return (
    <form action={action} className="flex flex-col gap-4 w-80">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          placeholder="Nome Call"
          defaultValue={state.fields.name}
        />

        {state?.errors?.name ? (
          <Label className="text-destructive">{state.errors?.name}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="product">Prodotto</Label>
        <Select
          defaultValue={state.fields.product || Products.IO}
          name="product"
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Seleziona un prodotto" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PRODUCT_MAP).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {state?.errors?.product ? (
          <Label className="text-destructive">{state.errors?.product}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data</Label>
        <DatePicker
          name="date"
          defaultValue={
            state.fields.date
              ? new Date(state.fields.date)
              : new Date(Date.now())
          }
        />

        {state?.errors?.date ? (
          <Label className="text-destructive">{state.errors?.date}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="members">Partecipanti</Label>
        <Input
          id="members"
          name="members"
          placeholder="Partecipanti del Team SM"
          defaultValue={state.fields.members || ""}
        />

        {state?.errors?.members ? (
          <Label className="text-destructive">{state.errors?.members}</Label>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="members">Link</Label>
        <Input
          id="link"
          name="link"
          placeholder="Link al Diario"
          defaultValue={state.fields.link || ""}
        />

        {state?.errors?.link ? (
          <Label className="text-destructive">{state.errors?.link}</Label>
        ) : null}
      </div>

      <ButtonGroup className="w-full">
        <Button
          type="submit"
          name="target"
          value="test"
          className="flex-1"
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={handleSubmitClick("test")}
        >
          {testIsLoading ? (
            <LoaderCircleIcon className="size-3.5 opacity-60 animate-spin" />
          ) : (
            <SlackIcon className="size-3.5 opacity-60" />
          )}
          Invia Test
        </Button>
        <Button
          type="submit"
          name="target"
          value="prod"
          className="flex-1"
          size="sm"
          disabled={isPending}
          onClick={handleSubmitClick("prod")}
        >
          {prodIsLoading ? (
            <LoaderCircleIcon className="size-3.5 opacity-60 animate-spin" />
          ) : (
            <SlackIcon className="size-3.5 opacity-60" />
          )}
          Invia Prod
        </Button>
      </ButtonGroup>
    </form>
  );
}
