/**
 * Errore tipizzato per fallimenti provenienti da Dynamics 365.
 *
 * Trasporta il contesto tecnico grezzo (status HTTP, codice OData, testo grezzo)
 * verso i layer superiori SENZA esporlo nella risposta HTTP: il `rawDetail` è
 * destinato esclusivamente ai log server-side (App Insights / DiagnosticSession).
 */
export class CrmError extends Error {
  readonly status: number;
  readonly odataCode?: string;
  readonly rawDetail?: string;
  step?: string;

  constructor(params: {
    status: number;
    odataCode?: string;
    rawDetail?: string;
    step?: string;
    message?: string;
  }) {
    super(params.message ?? `CRM request failed (status ${params.status})`);
    this.name = "CrmError";
    this.status = params.status;
    this.odataCode = params.odataCode;
    this.rawDetail = params.rawDetail;
    this.step = params.step;
  }
}
