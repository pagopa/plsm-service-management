// =============================================================================
// MEETING ORCHESTRATOR - Orchestratore completo per creazione appuntamenti CRM
// =============================================================================

import type {
  CreateMeetingOrchestratorRequest,
  CreateMeetingOrchestratorResponse,
  OrchestratorStepResult,
  ProductIdSelfcare,
  TipologiaReferente,
} from "../types/dynamics";
import { verifyAccount } from "./accounts";
import { verifyOrCreateContact } from "./contacts";
import { createAppointment } from "./appointments";
import { enableDryRun, disableDryRun } from "./httpClient";
import { createLogger, Timer } from "../utils/logger";
import {
  createDiagnosticSession,
  writeDiagnosticBlob,
  isDiagnosticEnabled,
  type DiagnosticSession,
} from "./diagnosticLogger";
import { resolveEnvironment } from "../utils/mappings";

// =============================================================================
// ORCHESTRATOR
// =============================================================================

/**
 * Orchestratore principale per la creazione di appuntamenti CRM.
 *
 * Esegue il flusso completo in 3 step:
 * 1. Verifica esistenza Ente (Account)
 * 2. Verifica/Crea Contatti per ogni partecipante
 * 3. Crea Appuntamento con activity_parties
 *
 * @param request - Dati per la creazione dell'appuntamento
 * @param request.baseUrl - Base URL for Dynamics 365 environment (e.g., "https://org.crm4.dynamics.com")
 * @param request.institutionIdSelfcare - ID Selfcare dell'ente
 * @param request.nomeEnte - Nome dell'ente (opzionale, usato come fallback)
 * @param request.productIdSelfcare - ID del prodotto Selfcare
 * @param request.partecipanti - Array di partecipanti all'appuntamento
 * @param request.subject - Oggetto dell'appuntamento
 * @param request.scheduledstart - Data/ora inizio (ISO 8601)
 * @param request.scheduledend - Data/ora fine (ISO 8601)
 * @param request.enableFallback - Abilita ricerca ente per nome se ID non trovato
 * @param request.enableCreateContact - Abilita creazione automatica contatti
 * @param request.dryRun - Modalità dry-run (no modifiche a Dynamics)
 * @param request.frontendPayload - Payload originale del frontend (per diagnostic logging)
 * @returns Risultato dell'orchestrazione con dettaglio di ogni step
 *
 * @example
 * const result = await createMeetingOrchestrator({
 *   baseUrl: "https://org.crm4.dynamics.com",
 *   institutionIdSelfcare: "uuid-ente",
 *   productIdSelfcare: "prod-pagopa",
 *   partecipanti: [{ nome: "Mario", cognome: "Rossi" }],
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

  // Crea logger con metadata del meeting
  const logger = createLogger(undefined, {
    institutionId: request.institutionIdSelfcare,
    productId: request.productIdSelfcare,
    dryRun,
    subject: request.subject,
  });

  const overallTimer = new Timer();

  // -------------------------------------------------------------------------
  // Diagnostic session (feature flag)
  // -------------------------------------------------------------------------
  const diagnosticEnabled = isDiagnosticEnabled();
  const environment = resolveEnvironment(request.baseUrl);
  const diagnosticSession: DiagnosticSession | undefined = diagnosticEnabled
    ? createDiagnosticSession(request.frontendPayload ?? request, environment)
    : undefined;

  logger.info("🚀 Starting meeting orchestrator", {
    institutionId: request.institutionIdSelfcare,
    productId: request.productIdSelfcare,
    partecipantiCount: request.partecipanti.length,
    enableCreateContact: request.enableCreateContact,
    enableFallback: request.enableFallback,
    dryRun,
    diagnosticLogging: diagnosticEnabled,
  });

  // Abilita dry-run se richiesto
  if (dryRun) {
    enableDryRun();
    logger.info(
      "🧪 DRY-RUN MODE ENABLED - No changes will be made to Dynamics",
      {
        enableCreateContact: request.enableCreateContact,
        enableFallback: request.enableFallback,
      },
    );
  }

  try {
    // =========================================================================
    // STEP 1: Verifica Ente
    // =========================================================================
    logger.info("📋 STEP 1/3: Account verification", {
      institutionId: request.institutionIdSelfcare,
      nomeEnte: request.nomeEnte,
    });

    const stepTimer = new Timer();
    let accountResult;

    try {
      accountResult = await verifyAccount({
        institutionIdSelfcare: request.institutionIdSelfcare,
        nomeEnte: request.nomeEnte,
        enableFallback: request.enableFallback ?? false,
        baseUrl: request.baseUrl,
        diagnosticSession,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(
        "❌ STEP 1 EXCEPTION: Account verification threw error",
        error,
        {
          duration: stepTimer.elapsed(),
          institutionId: request.institutionIdSelfcare,
        },
      );

      steps.push({
        step: "verifyAccount",
        success: false,
        error: `Exception during account verification: ${msg}`,
        dryRun,
      });

      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        `Errore durante verifica ente: ${msg}`,
        diagnosticSession,
      );
    }

    if (!accountResult.found || !accountResult.account) {
      logger.error("❌ STEP 1 FAILED: Account not found", undefined, {
        duration: stepTimer.elapsed(),
        error: accountResult.error,
      });

      steps.push({
        step: "verifyAccount",
        success: false,
        error: accountResult.error ?? "Ente non trovato",
        dryRun,
      });

      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        accountResult.error ?? "Ente non trovato",
        diagnosticSession,
      );
    }

    const accountId = accountResult.account.accountid;
    const accountName = accountResult.account.name ?? "N/A";

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

    logger.info("✅ STEP 1 COMPLETED: Account found", {
      accountId,
      accountName,
      method: accountResult.method,
      duration: stepTimer.elapsed(),
    });

    // =========================================================================
    // STEP 2: Verifica/Crea Contatti
    // =========================================================================
    logger.info("📋 STEP 2/3: Contact verification/creation", {
      partecipantiCount: request.partecipanti.length,
      enableCreateContact: request.enableCreateContact ?? false,
    });

    const contactStepTimer = new Timer();
    const contactIds: string[] = [];
    const contactResults: Array<{
      email: string;
      contactId?: string;
      created: boolean;
      error?: string;
    }> = [];

    try {
      console.log(
        "[STEP 2 START] Processing",
        request.partecipanti.length,
        "contacts",
      );

      for (const [index, partecipante] of request.partecipanti.entries()) {
        logger.info(
          `Processing contact ${index + 1}/${request.partecipanti.length}`,
          {
            email: partecipante.email,
            hasNome: !!partecipante.nome,
            hasCognome: !!partecipante.cognome,
          },
        );

        console.log(
          "[CONTACT VERIFY START]",
          index + 1,
          "of",
          request.partecipanti.length,
          "email:",
          partecipante.email,
        );

        const contactResult = await verifyOrCreateContact({
          baseUrl: request.baseUrl,
          email: partecipante.email,
          nome: partecipante.nome,
          cognome: partecipante.cognome,
          institutionIdSelfcare: request.institutionIdSelfcare,
          productIdSelfcare: request.productIdSelfcare as ProductIdSelfcare,
          tipologiaReferente: (partecipante.tipologiaReferente ??
            "TECNICO") as TipologiaReferente,
          accountId,
          enableCreateContact: request.enableCreateContact ?? false,
          diagnosticSession,
        });

        console.log(
          "[CONTACT VERIFY RESULT]",
          contactResult.created
            ? "CREATED"
            : contactResult.contact
              ? "FOUND"
              : "FAILED",
          "email:",
          partecipante.email,
        );

        if (contactResult.contact) {
          contactIds.push(contactResult.contact.contactid);
          contactResults.push({
            email: partecipante.email ?? "(no email)",
            contactId: contactResult.contact.contactid,
            created: contactResult.created,
          });
          logger.info(
            `✅ Contact ${contactResult.created ? "created" : "found"}`,
            {
              email: partecipante.email ?? "(no email)",
              contactId: contactResult.contact.contactid,
              created: contactResult.created,
            },
          );
        } else {
          contactResults.push({
            email: partecipante.email ?? "(no email)",
            created: false,
            error: contactResult.error,
          });
          warnings.push(
            `Contatto ${partecipante.email ?? "(senza email)"}: ${contactResult.error}`,
          );
          logger.warn(`⚠️ Contact processing failed`, {
            email: partecipante.email ?? "(no email)",
            error: contactResult.error,
          });
        }
      }

      console.log(
        "[STEP 2 CONTACTS PROCESSED]",
        contactIds.length,
        "of",
        request.partecipanti.length,
      );

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
        logger.error(
          "❌ STEP 2 FAILED: No valid contacts found or created",
          undefined,
          {
            duration: contactStepTimer.elapsed(),
            partecipantiCount: request.partecipanti.length,
          },
        );

        return buildErrorResponse(
          steps,
          warnings,
          dryRun,
          "Nessun contatto valido trovato o creato",
          diagnosticSession,
        );
      }

      logger.info("✅ STEP 2 COMPLETED: Contacts processed", {
        contactsProcessed: contactIds.length,
        totalPartecipanti: request.partecipanti.length,
        duration: contactStepTimer.elapsed(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      logger.error(
        "❌ STEP 2 EXCEPTION: Contact verification/creation threw error",
        error,
        {
          duration: contactStepTimer.elapsed(),
          partecipantiCount: request.partecipanti.length,
          contactsProcessedBeforeError: contactIds.length,
        },
      );

      console.log("[STEP 2 EXCEPTION]", msg, stack);

      steps.push({
        step: "verifyOrCreateContacts",
        success: false,
        error: `Exception during contact processing: ${msg}`,
        dryRun,
      });

      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        `Errore durante verifica/creazione contatti: ${msg}`,
        diagnosticSession,
      );
    }

    // =========================================================================
    // STEP 3: Crea Appuntamento
    // =========================================================================
    logger.info("📋 STEP 3/3: Appointment creation", {
      subject: request.subject,
      scheduledstart: request.scheduledstart,
      scheduledend: request.scheduledend,
      contactsCount: contactIds.length,
    });

    const appointmentTimer = new Timer();
    let appointment;

    try {
      appointment = await createAppointment({
        subject: request.subject,
        scheduledstart: request.scheduledstart,
        scheduledend: request.scheduledend,
        location: request.location,
        description: request.description,
        oggettoDelContatto: request.oggettoDelContatto,
        categoria: request.categoria,
        dataProssimoContatto: request.dataProssimoContatto,
        productIdSelfcare: request.productIdSelfcare as ProductIdSelfcare,
        accountId,
        contactIds,
        baseUrl: request.baseUrl,
        diagnosticSession,
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

      logger.info("✅ STEP 3 COMPLETED: Appointment created", {
        activityId: appointment.activityid,
        duration: appointmentTimer.elapsed(),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error("❌ STEP 3 FAILED: Appointment creation failed", error, {
        duration: appointmentTimer.elapsed(),
      });

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
        diagnosticSession,
      );
    }

    // =========================================================================
    // COMPLETATO
    // =========================================================================
    const totalDuration = overallTimer.elapsed();
    logger.info(
      dryRun
        ? "🧪 DRY-RUN COMPLETED SUCCESSFULLY"
        : "✅ ORCHESTRATOR COMPLETED SUCCESSFULLY",
      {
        totalDuration,
        activityId: appointment.activityid,
        accountId,
        contactsProcessed: contactIds.length,
        warningsCount: warnings.length,
      },
    );

    const finalResponse: CreateMeetingOrchestratorResponse = {
      success: true,
      dryRun,
      activityId: appointment.activityid,
      accountId,
      contactIds,
      steps,
      warnings,
      timestamp: new Date().toISOString(),
    };

    // Scrivi il blob diagnostico in fire-and-forget
    if (diagnosticSession) {
      diagnosticSession.orchestratorResult = finalResponse;
      await writeDiagnosticBlob(diagnosticSession);
    }

    return finalResponse;
  } catch (error) {
    // Catch globale per errori non gestiti
    const msg = error instanceof Error ? error.message : String(error);
    const totalDuration = overallTimer.elapsed();

    logger.error("❌ ORCHESTRATOR UNHANDLED EXCEPTION", error, {
      totalDuration,
      stepsCompleted: steps.length,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    if (steps.length === 0 || steps[steps.length - 1].success) {
      steps.push({
        step: "unhandledException",
        success: false,
        error: msg,
        dryRun,
      });
    }

    const errorResponse: CreateMeetingOrchestratorResponse = {
      success: false,
      dryRun,
      steps,
      warnings: [...warnings, `Errore non gestito: ${msg}`],
      timestamp: new Date().toISOString(),
    };

    if (diagnosticSession) {
      diagnosticSession.orchestratorResult = errorResponse;
      await writeDiagnosticBlob(diagnosticSession);
    }

    return errorResponse;
  } finally {
    if (dryRun) {
      disableDryRun();
    }
  }
}

// -----------------------------------------------------------------------------
// Helper per costruire response di errore
// -----------------------------------------------------------------------------

async function buildErrorResponse(
  steps: OrchestratorStepResult[],
  warnings: string[],
  dryRun: boolean,
  errorMessage: string,
  diagnosticSession?: DiagnosticSession,
): Promise<CreateMeetingOrchestratorResponse> {
  const logger = createLogger(undefined, { dryRun });
  logger.error(`❌ ORCHESTRATOR FAILED: ${errorMessage}`, undefined, {
    stepsCompleted: steps.length,
    warningsCount: warnings.length,
  });

  const response: CreateMeetingOrchestratorResponse = {
    success: false,
    dryRun,
    steps,
    warnings,
    timestamp: new Date().toISOString(),
  };

  if (diagnosticSession) {
    diagnosticSession.orchestratorResult = response;
    await writeDiagnosticBlob(diagnosticSession);
  }

  return response;
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

      if (p.email !== undefined && typeof p.email !== "string") {
        errors.push(`partecipanti[${i}].email deve essere una stringa`);
        continue;
      }

      if (
        p.email &&
        typeof p.email === "string" &&
        process.env.ENABLE_EMAIL_FORMAT_VALIDATION?.toLowerCase() === "true"
      ) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(p.email)) {
          errors.push(
            `partecipanti[${i}].email non è un indirizzo email valido`,
          );
        }
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

  /**
   * Validazione oggettoDelContatto: se presente, deve essere uno dei valori
   * picklist validi di pgp_oggettodelcontatto in Dynamics 365.
   * Valori validi:
   *   100000000 = Opportunità
   *   100000001 = Post-Vendita
   *   100000002 = Informativa
   *   100000003 = Comunicazione
   *   100000004 = Pre-Sales
   *   100000005 = Integrazione Tecnica
   */
  const VALID_OGGETTO_DEL_CONTATTO = [
    100000000, 100000001, 100000002, 100000003, 100000004, 100000005,
  ];
  if (req.oggettoDelContatto !== undefined) {
    const val = Number(req.oggettoDelContatto);
    if (!Number.isInteger(val) || !VALID_OGGETTO_DEL_CONTATTO.includes(val)) {
      errors.push(
        `oggettoDelContatto non è valido: ricevuto ${req.oggettoDelContatto}. ` +
          `Valori ammessi: ${VALID_OGGETTO_DEL_CONTATTO.join(", ")}`,
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: req as unknown as CreateMeetingOrchestratorRequest,
  };
}
