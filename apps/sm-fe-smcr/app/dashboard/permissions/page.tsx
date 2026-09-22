import {
  PermissionsListView,
  PermissionsManagementBreadcrumb,
} from "@/components/permissions/permissions-management-ui";
import { hasPermission } from "@/lib/auth/permissions";
import { logServerError } from "@/lib/logger/logger.server.helpers";
import { readPermissions } from "@/lib/services/teams.service";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [permissions, canManage] = await Promise.all([
    readPermissions(),
    hasPermission("permissions.manage"),
  ]);

  if (permissions.error || permissions.data === null) {
    logServerError(permissions.error, "Permissions page - read permissions error");
    throw new Error("Impossibile caricare i permessi.");
  }

  return (
    <div className="min-h-full w-full bg-white">
      <PermissionsManagementBreadcrumb />
      <PermissionsListView
        canManage={canManage}
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
