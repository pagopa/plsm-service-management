// =============================================================================
// MEETINGS HANDLER - Handler HTTP per Azure Functions
// =============================================================================

import type {
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import {
  createMeetingOrchestrator,
  validateOrchestratorRequest,
} from "../_shared/services/orchestrator";
import { listAppointments } from "../_shared/services/appointments";

// -----------------------------------------------------------------------------
// POST /meetings - Crea appuntamento (orchestrato)
// -----------------------------------------------------------------------------

export async function createMeetingHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("=== Create Meeting Request ===");

  try {
    const body = await request.json();

    // Validazione
    const validation = validateOrchestratorRequest(body);
    if (!validation.valid) {
      context.warn("Validation errors:", validation.errors);
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Log dry-run mode
    if (validation.data.dryRun) {
      context.log("🧪 DRY-RUN MODE ENABLED");
    }

    // Esegui orchestratore
    const result = await createMeetingOrchestrator(validation.data);

    // Status code basato sul risultato
    let status = 201;
    if (!result.success) {
      status = 500;
    } else if (result.warnings.length > 0) {
      status = 207; // Multi-Status
    }

    return {
      status,
      jsonBody: {
        ...result,
        message: result.success
          ? result.dryRun
            ? "Dry-run completato con successo"
            : "Appuntamento creato con successo"
          : "Errore durante la creazione dell'appuntamento",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Unexpected error:", errorMessage);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore interno del server",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// -----------------------------------------------------------------------------
// GET /meetings - Lista appuntamenti
// -----------------------------------------------------------------------------

export async function listMeetingsHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("=== List Meetings Request ===");

  try {
    const top = request.query.get("top") ?? "50";
    const filter = request.query.get("filter") ?? undefined;

    const result = await listAppointments({ top, filter });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.value,
        count: result.value?.length ?? 0,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Failed to list meetings:", errorMessage);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante il recupero degli appuntamenti",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

// -----------------------------------------------------------------------------
// POST /meetings/dry-run - Endpoint dedicato per test
// -----------------------------------------------------------------------------

export async function dryRunMeetingHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("=== Dry-Run Meeting Request ===");

  try {
    const body = await request.json();

    // Forza dry-run
    const requestWithDryRun = {
      ...(body as object),
      dryRun: true,
    };

    const validation = validateOrchestratorRequest(requestWithDryRun);
    if (!validation.valid) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors: validation.errors,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const result = await createMeetingOrchestrator(validation.data);

    return {
      status: result.success ? 200 : 400,
      jsonBody: {
        ...result,
        message: result.success
          ? "Dry-run completato - nessuna modifica effettuata"
          : "Dry-run fallito - verificare gli errori",
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    context.error("Dry-run error:", errorMessage);

    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore durante il dry-run",
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
    };
  }
}
