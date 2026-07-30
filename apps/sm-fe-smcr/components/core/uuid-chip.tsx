"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

function shortId(id: string) {
  return id.slice(0, 8);
}

export function UuidChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard?.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // no-op
    }
  };
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onCopy}
      title={id}
      className="bg-muted/60 hover:bg-muted/60 hover:border-primary hover:text-primary h-auto gap-1.5 rounded-md border px-2 py-1 font-normal transition-colors has-[>svg]:px-2"
    >
      <span className="font-mono text-xs">{shortId(id)}</span>
      {copied ? (
        <Check className="size-3" />
      ) : (
        <Copy className="size-3 opacity-60" />
      )}
    </Button>
  );
}
