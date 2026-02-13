// =============================================================================
// MEETING ORCHESTRATOR - Orchestratore completo per creazione appuntamenti CRM
// =============================================================================

import type {
  CreateMeetingOrchestratorRequest,
  CreateMeetingOrchestratorResponse,
  OrchestratorStepResult,
  ProductIdSelfcare,
  TipologiaReferente,
  Contact,
} from "../types/dynamics";
import { verifyAccount } from "./accounts";
import { verifyOrCreateContact } from "./contacts";
import { createAppointment } from "./appointments";
import { grantAccessToAppointment } from "./grantAccess";
import { enableDryRun, disableDryRun, isDryRunEnabled } from "./httpClient";

// =============================================================================
// ORCHESTRATOR
// =============================================================================

/**
 * Orchestratore principale per la creazione di appuntamenti CRM.
 *
 * Esegue il flusso completo in 4 step:
 * 1. Verifica esistenza Ente (Account)
 * 2. Verifica/Crea Contatti per ogni partecipante
 * 3. Crea Appuntamento con activity_parties
 * 4. GrantAccess per visibilità team Sales
 *
 * @param request - Dati per la creazione dell'appuntamento
 * @returns Risultato dell'orchestrazione con dettaglio di ogni step
 *
 * @example
 * const result = await createMeetingOrchestrator({
 *   institutionIdSelfcare: "uuid-ente",
 *   productIdSelfcare: "prod-pagopa",
 *   partecipanti: [{ email: "mario@ente.it", nome: "Mario", cognome: "Rossi" }],
 *   subject: "Riunione",
 *   scheduledstart: "2025-02-15T10:00:00Z",
 *   scheduledend: "2025-02-15T11:00:00Z",
 *   dryRun: true
 * });
 */
export async function createMeetingOrchestrator(
  request: CreateMeetingOrchestratorRequest,
): Promise<CreateMeetingOrchestratorResponse> {
  const steps: OrchestratorStepResult[] = [];
  const warnings: string[] = [];
  const dryRun = request.dryRun ?? false;

  // Abilita dry-run se richiesto
  if (dryRun) {
    enableDryRun();
    console.log("\n" + "=".repeat(60));
    console.log("🧪 ESECUZIONE IN MODALITÀ DRY-RUN");
    console.log(
      `Enable Create Contact:${request.enableCreateContact} - Enable Fallback Ente:${request.enableFallback}`,
    );

    console.log("   Nessuna modifica verrà effettuata su Dynamics CRM");
    console.log("=".repeat(60) + "\n");
  }

  try {
    // =========================================================================
    // STEP 1: Verifica Ente
    // =========================================================================
    console.log("\n📋 STEP 1: Verifica Ente");
    console.log("-".repeat(40));

    const accountResult = await verifyAccount({
      institutionIdSelfcare: request.institutionIdSelfcare,
      nomeEnte: request.nomeEnte,
      enableFallback: (request.enableFallback = false),
    });

    if (!accountResult.found || !accountResult.account) {
      steps.push({
        step: "verifyAccount",
        success: false,
        error: accountResult.error ?? "Ente non trovato",
        dryRun,
      });

      // L'ente non è stato trovato
      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        accountResult.error ?? "Ente non trovato",
      );
    }

    const accountId = accountResult.account.accountid;
    const accountName = accountResult.account.name ?? "N/A";

    // L'ente è stato trovato
    steps.push({
      step: "verifyAccount",
      success: true,
      data: {
        accountId,
        accountName,
        method: accountResult.method,
      },
      dryRun,
    });

    console.log(`✅ Ente trovato: ${accountName} (${accountId})`);

    // =========================================================================
    // STEP 2: Verifica/Crea Contatti
    // =========================================================================
    console.log("\n📋 STEP 2: Verifica/Crea Contatti");
    console.log("-".repeat(40));

    const contactIds: string[] = [];
    const contactResults: Array<{
      email: string;
      contactId?: string;
      created: boolean;
      error?: string;
    }> = [];

    for (const partecipante of request.partecipanti) {
      console.log(`\n  → Elaborazione: ${partecipante.email}`);

      const contactResult = await verifyOrCreateContact({
        email: partecipante.email,
        nome: partecipante.nome,
        cognome: partecipante.cognome,
        institutionIdSelfcare: request.institutionIdSelfcare,
        productIdSelfcare: request.productIdSelfcare as ProductIdSelfcare,
        tipologiaReferente: (partecipante.tipologiaReferente ??
          "TECNICO") as TipologiaReferente,
        accountId,
        enableCreateContact: (request.enableCreateContact = false),
      });

      if (contactResult.contact) {
        contactIds.push(contactResult.contact.contactid);
        contactResults.push({
          email: partecipante.email,
          contactId: contactResult.contact.contactid,
          created: contactResult.created,
        });
        console.log(
          `    ✅ ${contactResult.created ? "Creato" : "Trovato"}: ${contactResult.contact.contactid}`,
        );
      } else {
        contactResults.push({
          email: partecipante.email,
          created: false,
          error: contactResult.error,
        });
        warnings.push(`Contatto ${partecipante.email}: ${contactResult.error}`);
        console.log(`    ⚠️ ${contactResult.error}`);
      }
    }

    steps.push({
      step: "verifyOrCreateContacts",
      success: contactIds.length > 0,
      data: {
        totalPartecipanti: request.partecipanti.length,
        contactsProcessed: contactIds.length,
        contactResults,
      },
      dryRun,
    });

    if (contactIds.length === 0) {
      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        "Nessun contatto valido trovato o creato",
      );
    }

    // =========================================================================
    // STEP 3: Crea Appuntamento
    // =========================================================================
    console.log("\n📋 STEP 3: Crea Appuntamento");
    console.log("-".repeat(40));

    let appointment;
    try {
      appointment = await createAppointment({
        subject: request.subject,
        scheduledstart: request.scheduledstart,
        scheduledend: request.scheduledend,
        location: request.location,
        description: request.description,
        nextstep: request.nextstep,
        dataProssimoContatto: request.dataProssimoContatto,
        accountId,
        contactIds,
      });

      steps.push({
        step: "createAppointment",
        success: true,
        data: {
          activityId: appointment.activityid,
          subject: request.subject,
          scheduledstart: request.scheduledstart,
          scheduledend: request.scheduledend,
          partecipanti: contactIds.length,
        },
        dryRun,
      });

      console.log(`✅ Appuntamento creato: ${appointment.activityid}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      steps.push({
        step: "createAppointment",
        success: false,
        error: msg,
        dryRun,
      });

      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        `Errore creazione appuntamento: ${msg}`,
      );
    }

    // =========================================================================
    // STEP 4: GrantAccess
    // =========================================================================
    console.log("\n📋 STEP 4: GrantAccess (visibilità team Sales)");
    console.log("-".repeat(40));

    const grantResult = await grantAccessToAppointment({
      activityId: appointment.activityid,
    });

    steps.push({
      step: "grantAccess",
      success: grantResult.success,
      data: {
        activityId: grantResult.activityId,
        teamId: grantResult.teamId,
      },
      error: grantResult.error,
      dryRun,
    });

    if (!grantResult.success) {
      warnings.push(
        `GrantAccess fallito: ${grantResult.error}. L'appuntamento è stato creato ma potrebbe non essere visibile al team Sales.`,
      );
      console.log(`⚠️ GrantAccess fallito: ${grantResult.error}`);
    } else {
      console.log(`✅ GrantAccess completato: team ${grantResult.teamId}`);
    }

    // =========================================================================
    // COMPLETATO
    // =========================================================================
    console.log("\n" + "=".repeat(60));
    console.log(
      dryRun ? "🧪 DRY-RUN COMPLETATO" : "✅ FLUSSO COMPLETATO CON SUCCESSO",
    );
    console.log("=".repeat(60) + "\n");

    return {
      success: true,
      dryRun,
      activityId: appointment.activityid,
      accountId,
      contactIds,
      steps,
      warnings,
      timestamp: new Date().toISOString(),
    };
  } finally {
    // Disabilita sempre dry-run alla fine
    if (dryRun) {
      disableDryRun();
    }
  }
}

// -----------------------------------------------------------------------------
// Helper per costruire response di errore
// -----------------------------------------------------------------------------

function buildErrorResponse(
  steps: OrchestratorStepResult[],
  warnings: string[],
  dryRun: boolean,
  errorMessage: string,
): CreateMeetingOrchestratorResponse {
  console.log("\n" + "=".repeat(60));
  console.log(`❌ FLUSSO INTERROTTO: ${errorMessage}`);
  console.log("=".repeat(60) + "\n");

  return {
    success: false,
    dryRun,
    steps,
    warnings,
    timestamp: new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// Validazione request
// -----------------------------------------------------------------------------

export function validateOrchestratorRequest(
  request: unknown,
):
  | { valid: true; data: CreateMeetingOrchestratorRequest }
  | { valid: false; errors: string[] } {
  const errors: string[] = [];
  const req = request as Record<string, unknown>;

  // Verifica campi obbligatori
  if (!req.institutionIdSelfcare && !req.nomeEnte) {
    errors.push("Specificare almeno uno tra institutionIdSelfcare e nomeEnte");
  }

  if (!req.productIdSelfcare) {
    errors.push("productIdSelfcare è obbligatorio");
  }

  if (
    !req.partecipanti ||
    !Array.isArray(req.partecipanti) ||
    req.partecipanti.length === 0
  ) {
    errors.push("partecipanti deve essere un array non vuoto");
  } else {
    for (let i = 0; i < req.partecipanti.length; i++) {
      const p = req.partecipanti[i] as Record<string, unknown>;
      if (!p.email) {
        errors.push(`partecipanti[${i}].email è obbligatorio`);
      }
    }
  }

  if (!req.subject) {
    errors.push("subject è obbligatorio");
  }

  if (!req.scheduledstart) {
    errors.push("scheduledstart è obbligatorio");
  }

  if (!req.scheduledend) {
    errors.push("scheduledend è obbligatorio");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: req as unknown as CreateMeetingOrchestratorRequest,
  };
}
