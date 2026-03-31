import { Product } from "@/lib/services/institution.service";
import { PRODUCT_MAP } from "@/lib/types/product";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ClipboardListIcon } from "lucide-react";

type Props = {
  onboardings: Array<Product>;
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
  const variant =
    status === "ACTIVE"
      ? "default"
      : status === "DELETED"
        ? "destructive"
        : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

function displayValue(value: string | boolean | undefined | null): string {
  if (value === undefined || value === null) return "—";
  if (typeof value === "boolean") return value ? "Sì" : "No";
  const s = String(value).trim();
  return s === "" ? "—" : s;
}

export default function OnboardingTab({ onboardings }: Props) {
  if (!onboardings?.length) {
    return (
      <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
        <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-8 text-center text-muted-foreground">
          Nessun onboarding presente per quest’ente.
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-4 overflow-auto">
        {onboardings.map((onb) => (
          <Card
            key={`${onb.tokenId}-${onb.createdAt}${onb.productId}`}
            className="bg-neutral-50 border-neutral-100"
          >
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardListIcon className="size-4 opacity-60" />
                  {PRODUCT_MAP[onb.productId] ?? onb.productId}
                </CardTitle>
                <StatusBadge status={onb.status} />
              </div>
              {onb.isAggregator && (
                <Badge
                  variant="secondary"
                  className="mt-1 w-fit bg-pagopa-primary/10 text-pagopa-primary border-pagopa-primary/20"
                >
                  Ente aggregatore
                </Badge>
              )}
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-0">
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">
                  Token ID
                </Label>
                <span className="text-sm font-mono break-all">
                  {onb.tokenId}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">
                  Data creazione
                </Label>
                <span className="text-sm">{formatDate(onb.createdAt)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">
                  Tipo ente
                </Label>
                <span className="text-sm">
                  {displayValue(onb.institutionType)}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">Origin</Label>
                <span className="text-sm">{onb.origin}</span>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-muted-foreground text-xs">
                  Codice origin
                </Label>
                <span className="text-sm">{displayValue(onb.originId)}</span>
              </div>
              {(onb.billing != null ||
                (onb as Record<string, unknown>).billing != null) && (
                <>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">
                      P. IVA
                    </Label>
                    <span className="text-sm">
                      {displayValue(onb.billing?.vatNumber)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-muted-foreground text-xs">
                      Servizi pubblici
                    </Label>
                    <span className="text-sm">
                      {displayValue(onb.billing?.publicServices)}
                    </span>
                  </div>
                  {onb.billing?.recipientCode != null &&
                    onb.billing.recipientCode !== "" && (
                      <div className="flex flex-col gap-1">
                        <Label className="text-muted-foreground text-xs">
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
                        <Label className="text-muted-foreground text-xs">
                          Codice fiscale fatturazione
                        </Label>
                        <span className="text-sm">
                          {onb.billing.taxCodeInvoicing}
                        </span>
                      </div>
                    )}
                </>
              )}
              {onb.updatedAt != null && onb.updatedAt !== "" && (
                <div className="flex flex-col gap-1">
                  <Label className="text-muted-foreground text-xs">
                    Data aggiornamento
                  </Label>
                  <span className="text-sm">{formatDate(onb.updatedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
