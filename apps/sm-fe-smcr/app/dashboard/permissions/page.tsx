import {
  PermissionsListView,
  PermissionsManagementBreadcrumb,
} from "@/components/permissions/permissions-management-ui";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { readPermissions } from "@/lib/services/teams.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const permissions = await readPermissions();

  if (permissions.error || permissions.data === null) {
    logServerError(permissions.error, "Permissions page - read permissions error");
    throw new Error("Impossibile caricare i permessi.");
  }

  return (
    <div className="min-h-full w-full bg-white">
      <PermissionsManagementBreadcrumb />
      <PermissionsListView
        permissions={permissions.data.map((permission) => ({
          code: permission.code,
          description: permission.description ?? "",
          id: permission.id,
          name: permission.name,
          status: permission.status,
        }))}
      />
    </div>
  );
}
