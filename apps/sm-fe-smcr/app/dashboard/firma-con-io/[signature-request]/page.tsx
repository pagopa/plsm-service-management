import { ErrorBase } from "@/components/error/error-overview";
import Header from "@/components/provisioning/header";
import { InstitutionInfoFirmaConIo } from "@/components/provisioning/institution/info-firma-con-io";
import { FirmaConIO } from "@/lib/services/firma-con-io.schema";
import { getFirmaConIoInstitution } from "@/lib/services/firma-con-io.service";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<{ fiscal_code?: string; vat_number?: string }>;
  params: Promise<{ "signature-request": string }>;
}) {
  const signature_request = (await params)["signature-request"];
  const { fiscal_code: fiscalCodeParam, vat_number: vatNumberParam } =
    await searchParams;
  const fiscal_code = fiscalCodeParam?.trim() ?? "";
  const vat_number = vatNumberParam?.trim() ?? "";

  if (!fiscal_code && !vat_number) {
    return (
      <ErrorBase
        title="Parametri di ricerca mancanti"
        text1="Specifica il codice fiscale o la partita IVA "
        text2="Effettua una nuova ricerca dalla dashboard."
        route="firma-con-io"
      />
    );
  }

  const identifier = fiscal_code
    ? { fiscal_code }
    : { vat_number: vat_number! };

  const { data, error } = await getFirmaConIoInstitution(
    signature_request,
    identifier,
  );

  if (error || !data) {
    return (
      <ErrorBase
        title={error ?? "Errore nel recupero dati"}
        text1={
          error === "Nessun ente trovato"
            ? "Nessun dato corrisponde al codice fiscale o alla partita IVA inseriti."
            : "Si è verificato un errore, riprova"
        }
        text2={
          error === "Nessun ente trovato"
            ? "Effettua una nuova ricerca."
            : "oppure effettua una nuova ricerca."
        }
        route="firma-con-io"
      />
    );
  }

  return (
    <div className="w-full h-full p-4 flex flex-col space-y-8 overflow-hidden">
      <Header route="firma-con-io" />

      <InstitutionInfoFirmaConIo
        data={data as FirmaConIO}
        historyParams={
          fiscal_code
            ? { signature_request, fiscal_code }
            : { signature_request, vat_number: vat_number! }
        }
      />
    </div>
  );
}
