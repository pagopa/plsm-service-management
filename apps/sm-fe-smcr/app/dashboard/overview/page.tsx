import { PermissionDenied } from "@/components/auth/permission-denied";
import SearchInstitution from "@/components/provisioning/search/form";
import { Card } from "@/components/ui/card";
import { checkPermission } from "@/lib/auth/permissions";

export default async function Page() {
  const canReadOverview = await checkPermission(
    "overview.read",
    "/dashboard/overview",
  );

  if (!canReadOverview) {
    return <PermissionDenied feature="Overview" />;
  }

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
