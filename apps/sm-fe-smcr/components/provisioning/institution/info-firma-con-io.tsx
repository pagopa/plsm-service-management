"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { FirmaConIO } from "@/lib/services/firma-con-io.service";
import { useLocalStorage } from "@uidotdev/usehooks";
import { format, parseISO } from "date-fns";
import { AlertTriangle, Files, FileText } from "lucide-react";
import { useEffect } from "react";
import InfoItem from "./info-item";

export const InstitutionInfoFirmaConIo = ({
  data,
  historyParams,
}: {
  data: FirmaConIO;
  historyParams: { signature_request: string; fiscal_code: string };
}) => {
  const [history, saveHistory] = useLocalStorage<{
    items: Array<{ signature_request: string; fiscal_code: string }>;
  }>("institution-history-firma-con-io", {
    items: [],
  });

  useEffect(() => {
    saveHistory({
      items: [
        {
          signature_request: historyParams.signature_request,
          fiscal_code: historyParams.fiscal_code,
        },
        ...history.items.filter(
          (item) =>
            !(
              item.signature_request === historyParams.signature_request &&
              item.fiscal_code === historyParams.fiscal_code
            ),
        ),
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyParams.fiscal_code, historyParams.signature_request, saveHistory]);

  return (
    <div className="flex flex-col gap-6">
      {/* Details panel */}
      <div className="rounded-md border border-neutral-200 bg-white">
        <div className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <h4 className="font-semibold">Dettagli Tecnici</h4>
          </div>
          <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-4 grid grid-cols-3 gap-4">
            <InfoItem name="id" label="ID" value={data?.id || "-"} isCopyable />
            <InfoItem
              name="dossier_id"
              label="Dossier ID"
              value={data?.dossier_id || "-"}
              isCopyable
            />
            <InfoItem
              name="signer_id"
              label="Signer ID"
              value={data?.signer_id || "-"}
              isCopyable
            />
            <InfoItem
              name="issuer_id"
              label="Issuer ID"
              value={data?.issuer_id || "-"}
              isCopyable
            />
            <InfoItem name="status" label="Stato" value={data?.status || "-"} />
            {data.status === "REJECTED" && (
              <>
                <InfoItem
                  name="reason"
                  label="Motivo"
                  value={data.reject_reason}
                />
                <InfoItem
                  name="rejected_at"
                  label="Respinto il"
                  value={
                    data.rejected_at
                      ? format(
                          parseISO(data.rejected_at),
                          "dd/MM/yyyy HH:mm:ss",
                        )
                      : "-"
                  }
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Documents section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">Dettaglio Operativo</h3>
          <Badge variant="secondary" className="rounded-full">
            {data?.documents?.length ?? 0} documenti
          </Badge>
        </div>

        <div className="flex flex-col gap-4">
          {(data?.documents ?? []).map((doc, index) => (
            <Accordion key={doc.id} type="single" collapsible>
              <AccordionItem value={`item-${index}`}>
                <AccordionTrigger className="border-b rounded-none rounded-t-md border shadow-sm border-neutral-200 overflow-hidden bg-white px-4 py-3">
                  <div className="flex flex-row items-center justify-start gap-2">
                    <Files className="size-4 text-sky-500" />
                    <div className="font-semibold">
                      Documento {index + 1}: {doc.metadata.title}
                    </div>{" "}
                  </div>
                </AccordionTrigger>
                {/* <AccordionTrigger>Product Information</AccordionTrigger> */}
                <AccordionContent className="border rounded-b-md shadow-sm border-neutral-200 overflow-hidden bg-white px-4 py-3">
                  {/* Body */}
                  <div className="px-4 py-3 bg-neutral-50 rounded-md border border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InfoItem
                      name="doc_id"
                      label="ID Documento"
                      value={doc.id}
                      isCopyable
                    />
                    <InfoItem
                      name="doc_status"
                      label="Stato"
                      value={doc.status}
                    />
                    <InfoItem
                      name="uploaded_at"
                      label="Caricato il"
                      value={
                        doc.uploaded_at
                          ? format(
                              parseISO(doc.uploaded_at),
                              "dd/MM/yyyy HH:mm:ss",
                            )
                          : "-"
                      }
                    />
                    <InfoItem
                      name="created_at_doc"
                      label="Creato il"
                      value={
                        doc.created_at
                          ? format(
                              parseISO(doc.created_at),
                              "dd/MM/yyyy HH:mm:ss",
                            )
                          : "-"
                      }
                    />
                    <InfoItem
                      name="updated_at_doc"
                      label="Aggiornato il"
                      value={
                        doc.updated_at
                          ? format(
                              parseISO(doc.updated_at),
                              "dd/MM/yyyy HH:mm:ss",
                            )
                          : "-"
                      }
                    />
                    <InfoItem name="url" label="URL">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline break-all"
                      >
                        {doc.url}
                      </a>
                    </InfoItem>
                    {/* Signature fields list */}
                    <div className="col-span-full">
                      <Accordion type="multiple" className="w-full">
                        {(doc.metadata.signature_fields ?? []).map(
                          (field, fIndex) => (
                            <AccordionItem
                              key={`sig-field-${fIndex}`}
                              value={`sig-field-${fIndex}`}
                            >
                              <AccordionTrigger className="px-3 py-2 rounded-md bg-white border text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <span>Campo firma {fIndex + 1}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {field.clause.type} • {field.clause.title}
                                  </span>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-0">
                                <div className="mt-2 bg-white rounded-md border p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <InfoItem
                                    name={`field_${fIndex}_title`}
                                    label="Titolo Clausola"
                                    value={field.clause.title}
                                  />
                                  <InfoItem
                                    name={`field_${fIndex}_type`}
                                    label="Tipo"
                                    value={field.clause.type}
                                  />
                                  <InfoItem
                                    name={`field_${fIndex}_page`}
                                    label="Pagina"
                                    value={String(field.attrs.page)}
                                  />
                                  <InfoItem
                                    name={`field_${fIndex}_coords`}
                                    label="Coordinate (x, y)"
                                    value={`${field.attrs.coordinates.x}, ${field.attrs.coordinates.y}`}
                                  />
                                  <InfoItem
                                    name={`field_${fIndex}_size`}
                                    label="Dimensioni (w×h)"
                                    value={`${field.attrs.size.w}×${field.attrs.size.h}`}
                                  />
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ),
                        )}
                      </Accordion>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </div>
      </div>

      {/* Data section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold">Supporto tecnico</h3>
        </div>

        <div className="flex flex-col gap-4">
          <Accordion type="single" collapsible>
            <AccordionItem value="support">
              <AccordionTrigger className="border-b rounded-none rounded-t-md border shadow-sm border-neutral-200 overflow-hidden bg-white px-4 py-3">
                <div className="flex flex-row items-center justify-start gap-2">
                  <AlertTriangle className="size-4 text-sky-500" />
                  <div className="font-semibold">Dettagli tecnici</div>{" "}
                </div>
              </AccordionTrigger>
              {/* <AccordionTrigger>Product Information</AccordionTrigger> */}
              <AccordionContent className="border rounded-b-md shadow-sm border-neutral-200 overflow-hidden bg-white px-4 py-3">
                {/* Body */}
                <div className="px-4 py-3 bg-neutral-50 rounded-md border border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InfoItem
                    name="created_at"
                    label="Data Creazione"
                    value={
                      data?.created_at
                        ? format(
                            parseISO(data.created_at),
                            "dd/MM/yyyy HH:mm:ss",
                          )
                        : "-"
                    }
                  />
                  <InfoItem
                    name="updated_at"
                    label="Ultimo Aggiornamento"
                    value={
                      data?.created_at
                        ? format(
                            parseISO(data.updated_at),
                            "dd/MM/yyyy HH:mm:ss",
                          )
                        : "-"
                    }
                  />
                  <InfoItem
                    name="expires_at"
                    label="Scadenza"
                    value={
                      data?.created_at
                        ? format(
                            parseISO(data.expires_at),
                            "dd/MM/yyyy HH:mm:ss",
                          )
                        : "-"
                    }
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};
