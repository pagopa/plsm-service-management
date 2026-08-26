import { cn } from "@/lib/utils";
import { ArrowUpDown, Funnel, Plus, Search } from "lucide-react";
import Link from "next/link";

type PermissionStatus = "active" | "archived";

export type PermissionsListPermission = {
  code: string;
  description: string;
  id: number | string;
  name: string;
  status: PermissionStatus;
};

const permissionStatusPresentation: Record<
  PermissionStatus,
  { className: string; label: string }
> = {
  active: { className: "bg-[#00c950]", label: "Attivo" },
  archived: { className: "bg-neutral-300", label: "Archiviato" },
};

export function PermissionsManagementBreadcrumb() {
  return (
    <header className="flex h-16 w-full shrink-0 items-center border-b border-neutral-100 px-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-3 whitespace-nowrap text-base"
      >
        <span className="text-neutral-500">Admin</span>
        <span aria-hidden="true" className="text-neutral-500">
          /
        </span>
        <Link
          href="/dashboard/permissions"
          className="text-neutral-800 transition-colors hover:text-black"
        >
          Permessi
        </Link>
      </nav>
    </header>
  );
}

function SectionActions() {
  const actions = [
    { icon: Search, label: "Cerca" },
    { icon: ArrowUpDown, label: "Ordina" },
    { icon: Funnel, label: "Filtra" },
  ];

  return (
    <div className="flex items-center gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          aria-label={action.label}
          title={action.label}
          className="rounded-sm text-neutral-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <action.icon className="size-3" strokeWidth={1.75} />
        </button>
      ))}
    </div>
  );
}

function DashedAction() {
  return (
    <div className="w-full px-2 sm:px-4">
      <button
        type="button"
        className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-xs font-medium text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Plus className="size-3" strokeWidth={1.75} />
        Crea permesso
      </button>
    </div>
  );
}

export function PermissionsListView({
  permissions,
}: {
  permissions: PermissionsListPermission[];
}) {
  return (
    <section className="mx-auto flex w-full max-w-[544px] flex-col gap-4 px-4 py-6 sm:px-0">
      <div className="flex w-full items-center justify-between px-2 sm:px-4">
        <div className="flex items-baseline gap-3 whitespace-nowrap">
          <h1 className="text-base font-medium text-black">Permessi</h1>
          <span className="text-xs text-neutral-500">
            {permissions.length} permessi
          </span>
        </div>

        <SectionActions />
      </div>

      <DashedAction />

      <div className="flex w-full flex-col gap-1">
        {permissions.map((permission) => {
          const status = permissionStatusPresentation[permission.status];

          return (
            <div
              key={permission.id}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-3 transition-colors hover:bg-neutral-50 sm:px-4"
            >
              <span
                title={status.label}
                aria-label={`Stato permesso: ${status.label}`}
                className={cn("h-3 w-0.5 shrink-0 rounded-sm", status.className)}
              />

              <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="shrink-0 text-sm text-black">
                  {permission.name}
                </span>
                <code className="truncate font-mono text-xs text-neutral-500">
                  {permission.code}
                </code>
                <span className="truncate text-xs text-neutral-500">
                  {permission.description}
                </span>
              </div>
            </div>
          );
        })}

        {permissions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">
            Nessun permesso disponibile.
          </p>
        ) : null}
      </div>
    </section>
  );
}
