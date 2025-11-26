"use client";

import { Button } from "@/components/ui/button";
import { Service } from "@/lib/services/services-messages.service";
import { DownloadIcon } from "lucide-react";
import { useCallback } from "react";

type Props = {
  institution: string;
  items: Array<Service>;
};

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function flattenService(service: Service): Record<string, unknown> {
  return {
    id: service.id,
    name: service.name,
    version: service.version,
    currentlyOwnerFiscalCode: service.currentlyOwnerFiscalCode,
    currentlyOwnerOrgName: service.currentlyOwnerOrgName,
    isVisible: service.isVisible,
    topic: service.topic ?? "",
    subTopic: service.subTopic ?? "",
    departmentName: service.departmentName,
    maxAllowedPaymentAmount: service.maxAllowedPaymentAmount,
    requireSecureChannels: service.requireSecureChannels,
    "metadata.scope": service.metadata?.scope ?? "",
    "metadata.address": service.metadata?.address ?? "",
    "metadata.appAndroid": service.metadata?.appAndroid ?? "",
    "metadata.appIos": service.metadata?.appIos ?? "",
    "metadata.cta": service.metadata?.cta ?? "",
    "metadata.description": service.metadata?.description ?? "",
    "metadata.email": service.metadata?.email ?? "",
    "metadata.pec": service.metadata?.pec ?? "",
    "metadata.phone": service.metadata?.phone ?? "",
    "metadata.privacyUrl": service.metadata?.privacyUrl ?? "",
    "metadata.supportUrl": service.metadata?.supportUrl ?? "",
    "metadata.tokenName": service.metadata?.tokenName ?? "",
    "metadata.webUrl": service.metadata?.webUrl ?? "",
  };
}

function toCSV(
  rows: Array<Record<string, unknown>>,
  headerOrder: string[],
  delimiter = ",",
): string {
  if (!rows.length) {
    return headerOrder.join(delimiter);
  }

  const header = headerOrder.map(csvEscape).join(delimiter);
  const lines = rows.map((row) =>
    headerOrder
      .map((currentHeader) => csvEscape(row[currentHeader]))
      .join(delimiter),
  );
  return [header, ...lines].join("\r\n");
}

function downloadText(
  filename: string,
  content: string,
  mime = "text/csv;charset=utf-8",
) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ExportServices({ institution, items }: Props) {
  const isEmpty = !items || items.length === 0;

  const handleDownload = useCallback(() => {
    const headers = [
      "id",
      "name",
      "version",
      "currentlyOwnerFiscalCode",
      "currentlyOwnerOrgName",
      "isVisible",
      "topic",
      "subTopic",
      "departmentName",
      "maxAllowedPaymentAmount",
      "requireSecureChannels",
      "metadata.scope",
      "metadata.address",
      "metadata.appAndroid",
      "metadata.appIos",
      "metadata.cta",
      "metadata.description",
      "metadata.email",
      "metadata.pec",
      "metadata.phone",
      "metadata.privacyUrl",
      "metadata.supportUrl",
      "metadata.tokenName",
      "metadata.webUrl",
    ] as const;

    const flatRows = items.map(flattenService);

    const csv = toCSV(flatRows, headers as unknown as string[], ";");

    downloadText(
      `${institution.toLowerCase().replace(" ", "_")}_servizi_io.csv`,
      csv,
    );
  }, [items]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      disabled={isEmpty}
    >
      <DownloadIcon
        className="-ms-0.5 opacity-60 size-3.5 transition-transform"
        aria-hidden="true"
      />
      Esporta
    </Button>
  );
}
