import SearchFirmaConIo from "@/components/provisioning/search/search-firma-con-io";
import { Card } from "@/components/ui/card";
import { SearchSignerID } from "@/features/onboarding/components/SearchSignerID";

export default async function Page() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-md flex flex-col gap-3 min-w-[600px]">
        <Card className="p-4 min-h-[500px]">
          <div className="text-center">
            <p className="font-semibold">Ricerca Firma con io</p>
            <p className="text-sm">
              Inserisci l&apos;ID della signature request, poi scegli se cercare
              con il codice fiscale del firmatario o con la partita IVA
              dell&apos;ente.
            </p>
          </div>

          <SearchFirmaConIo />
        </Card>
        <Card className="p-4">
          <SearchSignerID />
        </Card>
      </div>
    </div>
  );
}
