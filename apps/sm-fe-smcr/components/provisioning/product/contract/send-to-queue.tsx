"use client";

import { sendToQueueAction } from "@/lib/actions/product.actions";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import QueueAlertDialog from "../queue-alert-dialog";

export default function SendToQueue({ onboarding }: { onboarding: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(sendToQueueAction, {
    fields: {
      onboarding: "",
    },
  });

  useEffect(() => {
    if (state.fields.onboarding) {
      if (state.errors?.root) {
        toast.error("Errore imprevisto, riprova più tardi.");
      } else {
        toast.success("Messaggio inviato in coda correttamente.");
      }
    }
  }, [state]);

  return (
    <form action={action} ref={formRef}>
      <input type="hidden" name="onboarding" value={onboarding} />
      <QueueAlertDialog isPending={isPending} formRef={formRef} />
    </form>
  );
}
