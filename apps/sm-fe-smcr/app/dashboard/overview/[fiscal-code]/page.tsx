import { ErrorBase } from "@/components/error/error-overview";
import Header from "@/components/provisioning/header";
import InstitutionInfo from "@/components/provisioning/institution/info";
import TabsSection from "@/components/provisioning/product/tabs";
import {
  getInstitutionWithSubunits,
  Institution,
} from "@/lib/services/institution.service";

function findOnboardingId(institutions: Array<Institution>, product: string) {
  let onboarding = null;

  for (let i = 0; i < institutions.length; i++) {
    const institution = institutions[i]!;

    onboarding = institution.onboarding.find((onboarding) => {
      return onboarding.productId === product;
    });

    if (onboarding) {
      break;
    }
  }

  return onboarding || null;
}

export default async function Page({
  searchParams,
  params,
}: {
  searchParams: Promise<{ institution: string; product: string }>;
  params: Promise<{ "fiscal-code": string }>;
}) {
  const { institution, product } = await searchParams;
  const taxCode = (await params)["fiscal-code"] as string;
  const institutionsResponse = await getInstitutionWithSubunits(
    taxCode as string,
  );

  const onboarding = findOnboardingId(institutionsResponse.data, product);

  if (institutionsResponse.error || !institutionsResponse.data) {
    return (
      <ErrorBase
        title={institutionsResponse.error ?? "Errore nel recupero dati"}
        text1={
          institutionsResponse.error === "Nessun ente trovato"
            ? "Nessun ente è presente su Area Riservata per il Codice fiscale inserito."
            : "Si è verificato un errore, riprova"
        }
        text2={
          institutionsResponse.error === "Nessun ente trovato"
            ? "Effettua una nuova ricerca."
            : "oppure effettua una nuova ricerca."
        }
        route="overview"
      />
    );
  }

  return (
    <div className="w-full h-full p-4 flex flex-col space-y-8 overflow-hidden">
      <Header route="overview" />

      <InstitutionInfo institutions={institutionsResponse.data} />

      {taxCode && institution && product && (
        <TabsSection
          taxCode={taxCode}
          institution={institution}
          institutionDescription={
            institutionsResponse.data?.find((item) => item.id === institution)
              ?.description || "contratto"
          }
          product={product}
          onboarding={onboarding?.tokenId || ""}
        />
      )}
    </div>
  );
}
