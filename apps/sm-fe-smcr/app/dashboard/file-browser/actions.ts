"use server";
import { updateManual } from "@/lib/services/portale-fatturazione.service";

export async function uploadManualAction(formData: FormData) {
  const file = formData.get("file");
  const fileName = formData.get("fileName") as string;
  if (!(file instanceof File)) {
    return { error: "Nessun file selezionato." };
  }
  console.log("fileName:", fileName);

  return await updateManual(file, fileName);
}
