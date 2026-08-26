import {
  PermissionsListView,
  PermissionsManagementBreadcrumb,
  type PermissionsListPermission,
} from "@/components/permissions/mock/permissions-management-ui";

const mockPermissions: PermissionsListPermission[] = [
  {
    code: "overview.read",
    description: "Accede alla pagina Overview.",
    id: 1,
    name: "Visualizza Overview",
    status: "active",
  },
  {
    code: "overview.search",
    description: "Cerca un ente da Overview.",
    id: 2,
    name: "Cerca ente",
    status: "active",
  },
  {
    code: "teams.manage",
    description: "Gestisce team, membri e assegnazioni.",
    id: 3,
    name: "Gestisci team",
    status: "active",
  },
  {
    code: "permissions.manage",
    description: "Crea e archivia i permessi.",
    id: 4,
    name: "Gestisci permessi",
    status: "active",
  },
  {
    code: "overview.write",
    description: "Modifica dati da Overview.",
    id: 5,
    name: "Modifica Overview",
    status: "archived",
  },
];

export default function Page() {
  return (
    <div className="min-h-full w-full bg-white">
      <PermissionsManagementBreadcrumb />
      <PermissionsListView permissions={mockPermissions} />
    </div>
  );
}
