"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { Certificate } from "@/lib/services/certificates.schema";
import type { ComponentProps } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

const PAGE_SIZE = 10;

function formatExpirationDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type BadgeVariant = NonNullable<ComponentProps<typeof Badge>["variant"]>;

function daysRemainingBadgeProps(days: number): {
  variant: BadgeVariant;
  className?: string;
} {
  if (days < 0) {
    return { variant: "destructive" };
  }
  if (days < 30) {
    return { variant: "outline-destructive" };
  }
  if (days < 180) {
    return { variant: "outline-warning" };
  }
  if (days < 365) {
    return {
      variant: "outline",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    };
  }
  return { variant: "outline-success" };
}

const CERTIFICATES_DAYS_LEGEND: Array<{
  label: string;
  example: string;
  variant: BadgeVariant;
  className?: string;
}> = [
  {
    label: "Certificato scaduto (giorni < 0)",
    example: "-12",
    variant: "destructive",
  },
  {
    label: "Meno di 30 giorni",
    example: "15",
    variant: "outline-destructive",
  },
  {
    label: "Tra 30 e 179 giorni",
    example: "90",
    variant: "outline-warning",
  },
  {
    label: "Tra 180 e 364 giorni",
    example: "270",
    variant: "outline",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
  },
  {
    label: "365 giorni o più",
    example: "400",
    variant: "outline-success",
  },
];

function CertificatesDaysLegend() {
  return (
    <div
      className="mb-4 w-fit rounded-xl border border-gray-200 bg-gray-50 p-4"
      aria-label="Legenda colori giorni rimanenti"
    >
      <p className="mb-3 text-xs font-semibold text-foreground">
        Legenda giorni rimanenti
      </p>
      <ul className="flex flex-col gap-2 sm:gap-x-6 sm:gap-y-2">
        {CERTIFICATES_DAYS_LEGEND.map((item) => (
          <li
            key={item.label}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Badge
              variant={item.variant}
              className={cn("tabular-nums", item.className)}
            >
              {item.example}
            </Badge>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CertificatesSection({
  certificates,
}: {
  certificates: Certificate[];
}) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(certificates.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);

  useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const paginatedRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return certificates.slice(start, start + PAGE_SIZE);
  }, [certificates, safePage]);

  const startIndex = certificates.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const endIndex = Math.min(
    (safePage + 1) * PAGE_SIZE,
    certificates.length,
  );

  const canPrev = safePage > 0;
  const canNext = safePage < totalPages - 1;

  if (certificates.length === 0) {
    return (
      <>
        <CertificatesDaysLegend />
        <p className="text-sm text-muted-foreground">
          Nessun certificato disponibile.
        </p>
      </>
    );
  }

  return (
    <>
      <CertificatesDaysLegend />
      <div className="overflow-x-auto">
        <Table className="min-w-full overflow-hidden rounded-xl border bg-gray-200 text-sm">
          <TableHeader>
            <TableRow>
              <TableHead className="border bg-gray-100 px-4 py-2 text-left">
                Nome
              </TableHead>
              <TableHead className="border bg-gray-100 px-4 py-2 text-left">
                Data di scadenza
              </TableHead>
              <TableHead className="border bg-gray-100 px-4 py-2 text-right">
                Giorni rimanenti
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.map((row, index) => {
              const badge = daysRemainingBadgeProps(row.days_remaining);
              const globalIndex = safePage * PAGE_SIZE + index;
              return (
                <TableRow
                  key={`${row.idp}-${row.use ?? "default"}-${globalIndex}`}
                  className="bg-white"
                >
                  <TableCell className="max-w-[320px] truncate border px-4 py-2 font-medium">
                    {row.idp}
                  </TableCell>
                  <TableCell className="border px-4 py-2">
                    {formatExpirationDate(row.expiration_date)}
                  </TableCell>
                  <TableCell className="border px-4 py-2 text-right">
                    <div className="flex justify-end">
                      <Badge
                        variant={badge.variant}
                        className={cn("tabular-nums", badge.className)}
                      >
                        {row.days_remaining}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground">{startIndex}</span>
          {" – "}
          <span className="text-foreground">{endIndex}</span>
          <span className="mx-1">di</span>
          {certificates.length}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Pagina {safePage + 1} di {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!canPrev}
              onClick={() => setPage(Math.max(0, safePage - 1))}
              aria-label="Pagina precedente"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={!canNext}
              onClick={() =>
                setPage(Math.min(totalPages - 1, safePage + 1))
              }
              aria-label="Pagina successiva"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
