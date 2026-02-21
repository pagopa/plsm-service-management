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
import { createLogger, Timer } from "../utils/logger";

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

  // Crea logger con metadata del meeting
  const logger = createLogger(undefined, {
    institutionId: request.institutionIdSelfcare,
    productId: request.productIdSelfcare,
    dryRun,
    subject: request.subject,
  });

  const overallTimer = new Timer();

  logger.info("🚀 Starting meeting orchestrator", {
    institutionId: request.institutionIdSelfcare,
    productId: request.productIdSelfcare,
    partecipantiCount: request.partecipanti.length,
    enableCreateContact: request.enableCreateContact,
    enableFallback: request.enableFallback,
    enableGrantAccess: request.enableGrantAccess,
    dryRun,
  });

  // Abilita dry-run se richiesto
  if (dryRun) {
    enableDryRun();
    logger.info(
      "🧪 DRY-RUN MODE ENABLED - No changes will be made to Dynamics",
      {
        enableCreateContact: request.enableCreateContact,
        enableFallback: request.enableFallback,
        enableGrantAccess: request.enableGrantAccess,
      },
    );
  }

  try {
    // =========================================================================
    // STEP 1: Verifica Ente
    // =========================================================================
    logger.info("📋 STEP 1/4: Account verification", {
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
    logger.info("📋 STEP 2/4: Contact verification/creation", {
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
          email: partecipante.email,
          nome: partecipante.nome,
          cognome: partecipante.cognome,
          institutionIdSelfcare: request.institutionIdSelfcare,
          productIdSelfcare: request.productIdSelfcare as ProductIdSelfcare,
          tipologiaReferente: (partecipante.tipologiaReferente ??
            "TECNICO") as TipologiaReferente,
          accountId,
          enableCreateContact: request.enableCreateContact ?? false,
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
            email: partecipante.email,
            contactId: contactResult.contact.contactid,
            created: contactResult.created,
          });
          logger.info(
            `✅ Contact ${contactResult.created ? "created" : "found"}`,
            {
              email: partecipante.email,
              contactId: contactResult.contact.contactid,
              created: contactResult.created,
            },
          );
        } else {
          contactResults.push({
            email: partecipante.email,
            created: false,
            error: contactResult.error,
          });
          warnings.push(
            `Contatto ${partecipante.email}: ${contactResult.error}`,
          );
          logger.warn(`⚠️ Contact processing failed`, {
            email: partecipante.email,
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
      );
    }

    // =========================================================================
    // STEP 3: Crea Appuntamento
    // =========================================================================
    logger.info("📋 STEP 3/4: Appointment creation", {
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
      );
    }

    // =========================================================================
    // STEP 4: GrantAccess
    // =========================================================================
    if (request.enableGrantAccess ?? false) {
      logger.info("📋 STEP 4/4: Grant access to Sales team", {
        activityId: appointment.activityid,
      });

      const grantTimer = new Timer();
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
        logger.warn(`⚠️ STEP 4 WARNING: GrantAccess failed`, {
          error: grantResult.error,
          duration: grantTimer.elapsed(),
        });
      } else {
        logger.info("✅ STEP 4 COMPLETED: Access granted to Sales team", {
          teamId: grantResult.teamId,
          duration: grantTimer.elapsed(),
        });
      }
    } else {
      logger.info(
        "ℹ️ STEP 4 SKIPPED: GrantAccess disabled via request parameter",
      );
      steps.push({
        step: "grantAccess",
        success: true,
        skipped: true,
        dryRun,
      });
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
  } catch (error) {
    // Catch globale per errori non gestiti
    const msg = error instanceof Error ? error.message : String(error);
    const totalDuration = overallTimer.elapsed();

    logger.error("❌ ORCHESTRATOR UNHANDLED EXCEPTION", error, {
      totalDuration,
      stepsCompleted: steps.length,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });

    // Aggiungi step di errore se non ce ne sono già
    if (steps.length === 0 || steps[steps.length - 1].success) {
      steps.push({
        step: "unhandledException",
        success: false,
        error: msg,
        dryRun,
      });
    }

    return {
      success: false,
      dryRun,
      steps,
      warnings: [...warnings, `Errore non gestito: ${msg}`],
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
  const logger = createLogger(undefined, { dryRun });
  logger.error(`❌ ORCHESTRATOR FAILED: ${errorMessage}`, undefined, {
    stepsCompleted: steps.length,
    warningsCount: warnings.length,
  });

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
