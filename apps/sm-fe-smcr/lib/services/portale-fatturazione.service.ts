"use server";
import { betterFetch } from "@better-fetch/fetch";

const STORAGE_TOKEN = process.env.STORAGE_TOKEN! as string;
const WEBHOOK_MANUAL_STORAGE = process.env.WEBHOOK_MANUAL_STORAGE! as string;

export async function updateManual(file: File, fileName: string) {
  if (!file) {
    return {
      error: "Nessun file selezionato.",
    };
  }

  try {
    const { data, error } = await betterFetch(
      `https://plsm-p-itn-pfatt-func-01.azurewebsites.net/api/v1/manuali?filename=${fileName}`,
      {
        method: "POST",
        body: file,
        headers: {
          Authorization: `Bearer ${STORAGE_TOKEN}`,
          "Content-Type": "application/pdf",
        },
      },
    );

    if (error || !data) {
      console.error(error);
      if (error?.status === 403)
        return {
          error: "Non autorizzato al caricamento del file, controllare la VPN",
        };

      if (error?.status === 413)
        return {
          error:
            "Il file è troppo grande. La dimensione massima consentita è 1MB.",
        };

      return { error: "Si è verificato un errore, riprova più tardi." };
    }

    return { error: null, data: data as string };
  } catch (error) {
    console.error(error);
    return { error: "Si è verificato un errore, riprova più tardi." };
  }
}

export async function slackMessageManual() {
  const payload = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: ":memo: *Abbiamo aggiornato il manuale di fatturazione* :memo:",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Ciao a tutti,\nabbiamo appena aggiornato il manuale di fatturazione alla nuova versione.\nVi invitiamo a prenderne visione per rimanere aggiornati su tutte le novità.\n:book:",
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Accedi al portale per prendere visione",
            },
            url: "https://portalefatturazione.pagopa.it/selezionaprodotto",
          },
        ],
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "Grazie per l'\''attenzione!",
          },
        ],
      },
    ],
  };

  const { error, data } = await betterFetch(WEBHOOK_MANUAL_STORAGE, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (error || !data) {
    console.error(error);
    return {
      error:
        "Si è verificato un errore nell'invio del messaggio su Slack, riprova più tardi.",
    };
  }

  return { error: null, data: data as string };
}
