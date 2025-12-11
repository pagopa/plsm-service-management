"use server";
import { betterFetch } from "@better-fetch/fetch";

const STORAGE_TOKEN = process.env.STORAGE_TOKEN! as string;

export async function updateManual(file: File, fileName: string) {
  if (!file) {
    return {
      error: "Nessun file selezionato.",
    };
  }

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
    return { error: "Si è verificato un errore, riprova più tardi." };
  }

  return { error: null, data: data as string };
}
