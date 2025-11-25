import { ErrorBase } from "@/components/error/error-overview";
import Header from "@/components/provisioning/header";
import { InstitutionInfoFirmaConIo } from "@/components/provisioning/institution/info-firma-con-io";
import {
  FirmaConIO,
  getFirmaConIoInstitution,
} from "@/lib/services/firma-con-io.service";

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<{ institution: string; product: string }>;
  params: Promise<{ "signature-request": string; "fiscal-code": string }>;
}) {
  const signature_request = (await params)["signature-request"];
  const fiscal_code = (await params)["fiscal-code"];

  const { data, error } = await getFirmaConIoInstitution(
    signature_request,
    fiscal_code,
  );

  if (error || !data) {
    return (
      <ErrorBase
        title={error ?? "Errore nel recupero dati"}
        text1={
          error === "Nessun ente trovato"
            ? "Nessun ente è presente su Area Riservata per il Codice fiscale inserito."
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
        historyParams={{ signature_request, fiscal_code }}
      />
    </div>
  );
}
