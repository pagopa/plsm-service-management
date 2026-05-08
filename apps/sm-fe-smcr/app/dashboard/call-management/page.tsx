"use client";

import { useState } from "react";
import { ArrowRightIcon, InfoIcon, LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CRMForm from "@/components/call-management/crm-form";
import SlackForm from "@/components/call-management/slack-form";
import {
  getInstitutionWithSubunits,
  type Institution,
} from "@/lib/services/institution.service";

type SearchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "found"; taxCode: string; institutions: Institution[] }
  | { status: "not-found"; taxCode: string };

const TAX_CODE_REGEX = /^\d{11}$/;

export default function Page() {
  const [taxCode, setTaxCode] = useState("");
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const handleSearch = async () => {
    const code = taxCode.trim();
    if (!code) {
      toast.error("Inserire un codice fiscale");
      return;
    }
    if (!TAX_CODE_REGEX.test(code)) {
      toast.error("Il codice fiscale deve essere composto da 11 cifre");
      return;
    }
    setState({ status: "searching" });
    const result = await getInstitutionWithSubunits(code);
    if (result.error || result.data.length === 0) {
      setState({ status: "not-found", taxCode: code });
      return;
    }
    setState({ status: "found", taxCode: code, institutions: result.data });
  };

  const handleReset = () => {
    setState({ status: "idle" });
    setTaxCode("");
  };

  const isSearching = state.status === "searching";
  const hasResult = state.status === "found" || state.status === "not-found";

  return (
    <main className="w-full min-h-full bg-muted/30 flex justify-center p-6">
      <div className="flex flex-col gap-6 w-full max-w-3xl">
        <div className="flex flex-col gap-4 bg-white rounded-xl border shadow-sm p-6">
          <div className="space-y-1">
            <h1 className="font-medium text-lg">Verifica Ente</h1>
            <p className="text-sm text-muted-foreground">
              Inserisci il codice fiscale dell&apos;ente (11 cifre) per
              verificarne la presenza su SelfCare e procedere con la
              registrazione della call.
            </p>
          </div>
          <div className="flex gap-2 items-start rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <InfoIcon className="size-4 mt-0.5 shrink-0" />
            <p>
              Se l&apos;ente è presente su SelfCare potrai registrare
              l&apos;appuntamento sul CRM e inviare il messaggio su Slack. In
              caso contrario, si tratterà di una call di Integrazione e il
              messaggio potrà essere inviato solo su Slack.
            </p>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="taxCode">Codice Fiscale</Label>
              <Input
                id="taxCode"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                placeholder="Inserisci codice fiscale..."
                disabled={isSearching || hasResult}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleSearch())
                }
              />
            </div>
            {hasResult ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="shrink-0"
              >
                Modifica
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="shrink-0"
              >
                {isSearching ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <ArrowRightIcon className="size-4" />
                )}
                Verifica
              </Button>
            )}
          </div>
        </div>

        {state.status === "found" && (
          <div className="flex flex-col gap-4 bg-white rounded-xl border shadow-sm p-6">
            <div className="text-center space-y-1">
              <h1 className="font-medium text-lg">
                Crea appuntamento CRM e invia su Slack
              </h1>
              <p className="text-sm text-muted-foreground">
                Ente trovato su SelfCare. Compila il form per registrare
                l&apos;appuntamento sul CRM e inviare il messaggio su Slack.
              </p>
            </div>
            <CRMForm
              taxCode={state.taxCode}
              institutions={state.institutions}
            />
          </div>
        )}

        {state.status === "not-found" && (
          <div className="flex flex-col gap-4 bg-white rounded-xl border shadow-sm p-6">
            <div className="space-y-1">
              <h1 className="font-medium text-lg">Invia messaggio su Slack</h1>
              <p className="text-sm text-muted-foreground">
                Ente non trovato su SelfCare. Puoi comunque inviare il messaggio
                su Slack.
              </p>
            </div>
            <div className="flex gap-2 items-start rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <InfoIcon className="size-4 mt-0.5 shrink-0" />
              <p>
                L&apos;ente non è presente sui nostri sistemi: si tratta di una
                call di Integrazione. In questo caso il messaggio verrà inviato
                solo su Slack.
              </p>
            </div>
            <SlackForm />
          </div>
        )}
      </div>
    </main>
  );
}
