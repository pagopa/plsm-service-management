"use client";

import { EllipsisVertical, LoaderCircleIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TeamStatus = "active" | "inactive";

type TeamStatusMenuProps = {
  status: TeamStatus;
  teamId: number;
};

export function TeamStatusMenu({ status, teamId }: TeamStatusMenuProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const nextStatus: TeamStatus = status === "active" ? "inactive" : "active";

  async function updateStatus() {
    setError(null);
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        body: JSON.stringify({ status: nextStatus }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      const result = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(
          result?.error ?? "Non è stato possibile aggiornare lo stato del team.",
        );
      }

      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Non è stato possibile aggiornare lo stato del team.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Azioni team"
          title="Azioni team"
          disabled={isUpdating}
          className="rounded-sm text-neutral-700 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {isUpdating ? (
            <LoaderCircleIcon className="size-3 animate-spin" />
          ) : (
            <EllipsisVertical className="size-3" strokeWidth={1.75} />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Stato team</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={isUpdating}
          onSelect={(event) => {
            event.preventDefault();
            void updateStatus();
          }}
        >
          {isUpdating
            ? "Aggiornamento in corso…"
            : status === "active"
              ? "Disattiva team"
              : "Attiva team"}
        </DropdownMenuItem>
        {error ? (
          <DropdownMenuLabel className="max-w-56 text-xs font-normal text-destructive">
            {error}
          </DropdownMenuLabel>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
