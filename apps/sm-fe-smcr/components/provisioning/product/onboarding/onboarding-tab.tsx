import { PRODUCT_MAP } from "@/lib/types/product";
import { getInstitutionOnboardingsFromSupport } from "@/lib/services/institution.service";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ClipboardListIcon } from "lucide-react";

type Props = {
  taxCode: string;
  subunitCode?: string;
  isPNPG?: boolean;
};

function formatDate(value: string | undefined) {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const variant =
    s === "ACTIVE" || s === "COMPLETED"
      ? "default"
      : s === "DELETED" || s === "REJECTED" || s === "FAILED"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function displayValue(value: string | boolean | undefined | null): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  const str = String(value).trim();
  return str === "" ? "—" : str;
}

export default async function OnboardingTab({
  taxCode,
  subunitCode,
  isPNPG = false,
}: Props) {
  const result = await getInstitutionOnboardingsFromSupport(taxCode, {
    subunitCode,
    isPNPG,
  });

  if (result.error) {
    return (
      <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          {result.error}
        </div>
      </section>
    );
  }

  const onboardings = [...result.data].sort((a, b) =>
    a.productId.localeCompare(b.productId),
  );

  if (!onboardings.length) {
    return (
      <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-8 text-center text-muted-foreground">
          Nessun onboarding presente per quest’ente.
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 overflow-auto">
        {onboardings.map((onb) => {
          const extra = onb as Record<string, unknown>;
          const createdAt =
            typeof extra.createdAt === "string" ? extra.createdAt : undefined;
          const updatedAt =
            typeof extra.updatedAt === "string" ? extra.updatedAt : undefined;

          return (
            <Card
              key={`${onb.id}-${onb.productId}-${onb.status}`}
              className="border-neutral-100 bg-neutral-50"
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardListIcon className="size-4 opacity-60" />
                    {PRODUCT_MAP[onb.productId] ?? onb.productId}
                  </CardTitle>
                  <StatusBadge status={onb.status} />
                </div>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  ID: {onb.id}
                </p>
              </CardHeader>
              <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Codice prodotto
                  </Label>
                  <span className="text-sm font-mono">{onb.productId}</span>
                </div>
                {createdAt && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Data creazione
                    </Label>
                    <span className="text-sm">{formatDate(createdAt)}</span>
                  </div>
                )}
                {updatedAt && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Data aggiornamento
                    </Label>
                    <span className="text-sm">{formatDate(updatedAt)}</span>
                  </div>
                )}
                {onb.billing != null && (
                  <>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        P. IVA
                      </Label>
                      <span className="text-sm">
                        {displayValue(onb.billing?.vatNumber)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Servizi pubblici
                      </Label>
                      <span className="text-sm">
                        {displayValue(onb.billing?.publicServices)}
                      </span>
                    </div>
                    {onb.billing?.recipientCode != null &&
                      onb.billing.recipientCode !== "" && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">
                            Codice destinatario
                          </Label>
                          <span className="text-sm">
                            {onb.billing.recipientCode}
                          </span>
                        </div>
                      )}
                    {onb.billing?.taxCodeInvoicing != null &&
                      onb.billing.taxCodeInvoicing !== "" && (
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-muted-foreground">
                            Codice fiscale fatturazione
                          </Label>
                          <span className="text-sm">
                            {onb.billing.taxCodeInvoicing}
                          </span>
                        </div>
                      )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
