import SearchInstitution from "@/components/provisioning/search/form";
import { Card } from "@/components/ui/card";
import { requirePermission } from "@/lib/auth/permissions";

export default async function Page() {
  await requirePermission("overview.read", "/dashboard/overview");

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-md flex flex-col gap-3 min-w-[600px]">
        <Card className="p-4 min-h-[500px]">
          <div className="text-center">
            <p className="font-semibold">Ricerca Ente</p>
            <p className="text-sm">
              Cerca un ente tramite codice fiscale per
              <br />
              visualizzare le informazioni e gestire i servizi.
            </p>
          </div>

          <SearchInstitution />
        </Card>
      </div>
    </div>
  );
}
