"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SignIDFormSchema } from "@/lib/services/firma-con-io.schema";
import { getFirmaConIoSignerID } from "@/lib/services/firma-con-io.service";
import { CheckIcon, ClipboardIcon, CornerDownLeft } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const errorMessages = {
  401: "Credenziali non valide",
  422: "Codice fiscale non valido",
  403: "Indirizzo IP non autorizzato",
  default: "Errore nel recupero del signer ID",
};

export function SearchSignerID() {
  const [signerID, setSignerID] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const form = useForm<z.infer<typeof SignIDFormSchema>>({
    defaultValues: {
      fiscal_code: "",
    },
  });

  const handleCopy = async () => {
    if (!signerID) return;
    try {
      await navigator.clipboard.writeText(signerID);
      setIsCopied(true);
      toast.success("Copiato!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Errore durante la copia");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Form {...form}>
        <form
          className="flex flex-col gap-6 w-full"
          action={async (formData) => {
            if (form.getValues("fiscal_code").length !== 16) {
              toast.error("Il codice fiscale deve essere lungo 16 caratteri");
              return;
            }
            const result = await getFirmaConIoSignerID(formData);
            if (result?.error) {
              console.error(result?.error);
              toast.error(
                errorMessages[result?.error as keyof typeof errorMessages] ||
                  errorMessages.default,
              );
              return;
            }
            setSignerID(result.data);
            form.reset();
          }}
        >
          <p className="font-semibold">Inserisci il codice fiscale</p>
          <FormField
            control={form.control}
            name="fiscal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Codice Fiscale</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Codice Fiscale"
                    className="w-full"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <Button variant="pagopaprimary" type="submit">
            Cerca <CornerDownLeft className="size-3.5 opacity-60" />
          </Button>
        </form>
      </Form>

      {signerID && (
        <div className="flex items-center justify-between border border-l-4 border-l-green-600 rounded-md px-4 py-3">
          <span className="text-sm font-medium">Signer ID: {signerID}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              type="button"
              onClick={handleCopy}
            >
              <ClipboardIcon className="size-4 opacity-60" />
            </Button>
            {isCopied && <CheckIcon className="size-4 text-green-600" />}
          </div>
        </div>
      )}
    </div>
  );
}
