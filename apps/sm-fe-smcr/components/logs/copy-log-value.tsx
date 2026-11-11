"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyLogValue({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copiato negli appunti");
    } catch {
      toast.error(
        "Copia non riuscita. Seleziona il testo e copialo manualmente.",
      );
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      aria-label={label}
      title={label}
      onClick={copy}
    >
      <CopyIcon aria-hidden="true" className="size-3.5" />
    </Button>
  );
}
