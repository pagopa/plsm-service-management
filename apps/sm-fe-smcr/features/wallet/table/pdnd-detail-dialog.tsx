"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

function shortId(id: string) {
  return id.slice(0, 8);
}

// Etichette note per i campi di EService (getEservice) e Descriptor (getVersion).
// I campi non mappati usano la chiave così com'è (fallback tollerante).
const fieldLabels: Record<string, string> = {
  id: "ID",
  producerId: "ID erogatore",
  name: "Nome",
  description: "Descrizione",
  technology: "Tecnologia",
  mode: "Modalità",
  isSignalHubEnabled: "Signal Hub",
  isConsumerDelegable: "Delega fruitore",
  isClientAccessDelegable: "Delega accesso client",
  personalData: "Dati personali",
  asyncExchange: "Scambio asincrono",
  version: "Versione",
  audience: "Audience",
  voucherLifespan: "Durata voucher (s)",
  dailyCallsPerConsumer: "Chiamate/giorno per fruitore",
  dailyCallsTotal: "Chiamate/giorno totali",
  state: "Stato",
  agreementApprovalPolicy: "Policy approvazione",
  serverUrls: "Server URL",
  publishedAt: "Pubblicato il",
};

const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatValue(value: unknown) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return value ? "Sì" : "No";
  }

  if (typeof value === "string") {
    if (isoDatePattern.test(value)) {
      return new Date(value).toLocaleString("it-IT", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return value;
  }

  if (typeof value === "number") {
    return value.toLocaleString("it-IT");
  }

  if (Array.isArray(value) && value.every((item) => typeof item !== "object")) {
    return (
      <ul className="list-disc space-y-0.5 pl-4">
        {value.map((item, index) => (
          <li key={index} className="break-all">
            {String(item)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre className="bg-muted/50 overflow-x-auto rounded-md p-2 text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function PdndDetailView({ data }: { data: unknown }) {
  if (data == null || typeof data !== "object") {
    return <pre className="text-xs">{String(data)}</pre>;
  }

  const entries = Object.entries(data as Record<string, unknown>);

  return (
    <dl className="divide-y">
      {entries.map(([key, value]) => (
        <div key={key} className="grid grid-cols-3 gap-3 py-2">
          <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {fieldLabels[key] ?? key}
          </dt>
          <dd className="col-span-2 break-words text-sm">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type PdndDetailDialogProps = {
  endpoint: string;
  id: string;
  title: string;
};

export function PdndDetailDialog({ endpoint, id, title }: PdndDetailDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<unknown>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint);
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          body &&
          typeof body === "object" &&
          "error" in body &&
          typeof (body as { error: unknown }).error === "string"
            ? (body as { error: string }).error
            : `Errore ${res.status}`;
        setError(message);
        setData(null);
        return;
      }

      setData(body);
    } catch {
      setError("Errore di rete durante la chiamata a PDND");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && data === null && !loading) {
      void load();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          title={id}
          className="bg-muted/60 hover:bg-muted/60 hover:border-primary hover:text-primary h-auto gap-1.5 rounded-md border px-2 py-1 font-normal transition-colors has-[>svg]:px-2"
        >
          <span className="font-mono text-xs">{shortId(id)}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="break-all font-mono text-xs">
            {id}
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-auto">
          {loading && (
            <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
              <Loader2 className="size-4 animate-spin" /> Caricamento da PDND…
            </div>
          )}
          {error && !loading && (
            <p className="text-destructive py-8 text-sm">{error}</p>
          )}
          {!loading && !error && data != null && <PdndDetailView data={data} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}
