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
import { createLogger } from "../_shared/utils/logger";
import {
  resolveDynamicsEnvironment,
  getDynamicsBaseUrl,
  isInvalidDynamicsEnvironmentError,
} from "../_shared/utils/requestEnvironment";

// -----------------------------------------------------------------------------
// POST /meetings - Crea appuntamento (orchestrato)
// -----------------------------------------------------------------------------

export async function createMeetingHandler(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("=== Create Meeting Request ===");

  try {
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    const body = await request.json();

    // Validazione
    const validation = validateOrchestratorRequest(body);
    if (!validation.valid) {
      const errors = validation.errors;
      context.warn("Validation errors:", errors);
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Log dry-run mode
    if (validation.data.dryRun) {
      context.log("🧪 DRY-RUN MODE ENABLED");
    }

    // Esegui orchestratore con baseUrl e frontendPayload per diagnostic logging
    const result = await createMeetingOrchestrator({
      ...validation.data,
      baseUrl,
      frontendPayload: body,
    });

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
    context.error("Unexpected error:", error);

    // Check for environment resolution errors
    if (isInvalidDynamicsEnvironmentError(error)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
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
  const logger = createLogger(context);
  logger.info("List Meetings request received");

  try {
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    const top = request.query.get("top") ?? "50";
    const filter = request.query.get("filter") ?? undefined;

    logger.info("Listing appointments", { odataTop: top, odataFilter: filter });

    const result = await listAppointments(baseUrl, { top, filter }, logger);
    const count = result.value?.length ?? 0;

    logger.info("Appointments listed successfully", { resultCount: count });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: result.value,
        count,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Failed to list meetings", error);

    // Check for environment resolution errors
    if (isInvalidDynamicsEnvironmentError(error)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
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
    // Resolve Dynamics environment from header
    const environment = resolveDynamicsEnvironment(request);
    const baseUrl = getDynamicsBaseUrl(environment);

    const body = await request.json();

    // Forza dry-run
    const requestWithDryRun = {
      ...(body as object),
      dryRun: true,
      baseUrl,
    };

    const validation = validateOrchestratorRequest(requestWithDryRun);
    if (!validation.valid) {
      const errors = validation.errors;
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors,
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
    context.error("Dry-run error:", error);

    // Check for environment resolution errors
    if (isInvalidDynamicsEnvironmentError(error)) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
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
