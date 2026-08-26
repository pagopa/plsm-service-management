"use client";

import { LoaderCircleIcon, Plus, SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Permission = {
  code: string;
  description: string | null;
  id: string;
  name: string;
  status: "active" | "archived";
};

type TeamPermission = {
  code: string;
  description: string | null;
  id: number;
  name: string;
  status: "active" | "archived";
};

type AddTeamPermissionDialogProps = {
  permissions: TeamPermission[];
  teamId: number;
  teamName: string;
};

function isPermission(value: unknown): value is Permission {
  if (!value || typeof value !== "object") {
    return false;
  }

  const permission = value as Record<string, unknown>;

  return (
    typeof permission.code === "string" &&
    (permission.description === null || typeof permission.description === "string") &&
    typeof permission.id === "string" &&
    typeof permission.name === "string" &&
    (permission.status === "active" || permission.status === "archived")
  );
}

export function AddTeamPermissionDialog({
  permissions: assignedPermissions,
  teamId,
  teamName,
}: AddTeamPermissionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingPermissionId, setPendingPermissionId] = useState<string | null>(
    null,
  );

  const assignedPermissionIds = new Set(
    assignedPermissions.map((permission) => permission.id),
  );
  const matchingPermissions = permissions.filter(
    (permission) =>
      permission.status === "active" &&
      !assignedPermissionIds.has(Number(permission.id)) &&
      permission.code.toLowerCase().includes(query.trim().toLowerCase()),
  );

  async function loadPermissions() {
    setError(null);
    setIsLoadingPermissions(true);

    try {
      const response = await fetch("/api/permissions");
      const result = (await response.json().catch(() => null)) as {
        data?: unknown;
      } | null;

      if (!response.ok || !Array.isArray(result?.data)) {
        throw new Error("Non è possibile caricare i permessi disponibili.");
      }

      setPermissions(result.data.filter(isPermission));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Non è possibile caricare i permessi disponibili.",
      );
    } finally {
      setIsLoadingPermissions(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (isSubmitting) {
      return;
    }

    setOpen(nextOpen);

    if (nextOpen) {
      setQuery("");
      void loadPermissions();
      return;
    }

    setError(null);
  }

  async function addPermission(permissionId: string) {
    const parsedPermissionId = Number(permissionId);

    if (!Number.isInteger(parsedPermissionId) || parsedPermissionId <= 0) {
      setError("Il permesso selezionato non è valido.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    setPendingPermissionId(permissionId);

    try {
      const response = await fetch(`/api/teams/${teamId}/permissions`, {
        body: JSON.stringify({ permissionId: parsedPermissionId }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile aggiungere il permesso. Riprova.",
        );
      }

      setOpen(false);
      setQuery("");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Non è stato possibile aggiungere il permesso. Riprova.",
      );
    } finally {
      setIsSubmitting(false);
      setPendingPermissionId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <div className="w-full px-2 sm:px-4">
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-200 py-2 text-xs font-medium text-black transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Plus className="size-3" strokeWidth={1.75} />
            Aggiungi permesso
          </button>
        </DialogTrigger>
      </div>

      <DialogContent
        className="gap-4 rounded-2xl p-6 sm:max-w-[512px]"
        showCloseButton={!isSubmitting}
      >
        <DialogHeader className="pr-6">
          <div className="flex items-baseline gap-2">
            <DialogTitle className="text-base font-medium">
              Aggiungi permesso
            </DialogTitle>
            <span className="truncate text-xs text-neutral-500">{teamName}</span>
          </div>
          <DialogDescription className="sr-only">
            Cerca un permesso tramite codice e assegnalo al team {teamName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <div className="relative">
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-3 -translate-y-1/2 text-neutral-500"
            />
            <Input
              aria-label="Cerca tramite codice"
              className="rounded-xl border-neutral-100 bg-neutral-50 pl-8 font-mono shadow-none"
              disabled={isSubmitting}
              placeholder="Cerca tramite codice..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          {query.trim() ? (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-neutral-500">Permessi disponibili</p>
              {isLoadingPermissions ? (
                <div className="flex items-center gap-2 py-1 text-sm text-neutral-500">
                  <LoaderCircleIcon className="size-4 animate-spin" />
                  Caricamento permessi…
                </div>
              ) : matchingPermissions.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {matchingPermissions.map((permission) => (
                    <button
                      key={permission.id}
                      type="button"
                      aria-busy={pendingPermissionId === permission.id}
                      disabled={isSubmitting}
                      onClick={() => void addPermission(permission.id)}
                      className="flex w-full items-center gap-2 rounded-md text-left transition-colors hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {pendingPermissionId === permission.id ? (
                        <LoaderCircleIcon className="size-4 shrink-0 animate-spin text-neutral-500" />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-3 w-0.5 shrink-0 rounded-sm bg-[#00c950]"
                        />
                      )}
                      <span className="flex min-w-0 items-baseline gap-2">
                        <span className="shrink-0 text-sm text-black">
                          {permission.name}
                        </span>
                        <code className="truncate font-mono text-xs text-neutral-500">
                          {permission.code}
                        </code>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="py-1 text-sm text-neutral-500">
                  Nessun permesso disponibile con questo codice.
                </p>
              )}
            </section>
          ) : (
            <section className="flex flex-col gap-3">
              <p className="text-sm text-neutral-500">Permessi già aggiunti</p>
              {assignedPermissions.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {assignedPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <span
                        aria-label={`Permesso: ${permission.status === "active" ? "Attivo" : "Archiviato"}`}
                        className={
                          permission.status === "active"
                            ? "h-3 w-0.5 shrink-0 rounded-sm bg-[#00c950]"
                            : "h-3 w-0.5 shrink-0 rounded-sm bg-neutral-300"
                        }
                      />
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span className="shrink-0 text-sm text-black">
                          {permission.name}
                        </span>
                        <code className="truncate font-mono text-xs text-neutral-500">
                          {permission.code}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-1 text-sm text-neutral-500">
                  Nessun permesso è stato ancora aggiunto.
                </p>
              )}
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
