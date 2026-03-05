// =============================================================================
// GRANT ACCESS SERVICE - Condivisione record con team Sales su Dynamics 365
// =============================================================================

import type { GrantAccessRequest } from "../types/dynamics";
import { postAction } from "./httpClient";
import { getTeamId, resolveEnvironment } from "../utils/mappings";
import { getConfigOrThrow } from "../utils/config";

// -----------------------------------------------------------------------------
// Endpoint 7: GrantAccess per Appuntamento
// -----------------------------------------------------------------------------

export interface GrantAccessParams {
  activityId: string;
  teamId?: string; // Se non specificato, usa il team di default per l'ambiente
}

export interface GrantAccessResult {
  success: boolean;
  activityId: string;
  teamId: string;
  error?: string;
}

/**
 * Condivide un Appuntamento con il team Sales per renderlo visibile.
 * 
 * Endpoint 7: POST /api/data/v9.2/appointments({id})/Microsoft.Dynamics.CRM.GrantAccess
 * 
 * Senza questa chiamata, l'appuntamento creato via API non è visibile
 * agli utenti del team Sales nella loro vista CRM.
 * 
 * @param params - Parametri per la condivisione
 * @param params.activityId - GUID dell'appuntamento da condividere
 * @param params.teamId - GUID del team (opzionale, usa default per ambiente)
 * @returns Risultato con success/error
 * 
 * @remarks
 * Se fallisce, l'appuntamento è stato creato ma non sarà visibile.
 * Gestire come warning, non come errore bloccante.
 */
export async function grantAccessToAppointment(
  params: GrantAccessParams
): Promise<GrantAccessResult> {
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);
  
  // Usa team specificato o quello di default per l'ambiente
  const teamId = params.teamId ?? getTeamId(environment);
  
  const url = `${cfg.DYNAMICS_BASE_URL}/api/data/v9.2/appointments(${params.activityId})/Microsoft.Dynamics.CRM.GrantAccess`;
  
  const body: GrantAccessRequest = {
    Principal: {
      "teamid@odata.bind": `/teams(${teamId})`,
    },
    AccessMask: "ReadAccess",
  };

  console.log(`[GrantAccess] Condivisione appuntamento ${params.activityId} con team ${teamId}`);
  console.log(`[GrantAccess] Ambiente: ${environment}`);

  try {
    await postAction(url, body);
    
    console.log(`[GrantAccess] ✅ Appuntamento condiviso con successo`);
    return {
      success: true,
      activityId: params.activityId,
      teamId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[GrantAccess] ❌ Errore condivisione: ${msg}`);
    
    return {
      success: false,
      activityId: params.activityId,
      teamId,
      error: msg,
    };
  }
}

// -----------------------------------------------------------------------------
// GrantAccess generico per qualsiasi entità
// -----------------------------------------------------------------------------

export interface GrantAccessGenericParams {
  entityName: string;
  entityId: string;
  teamId?: string;
  accessMask?: GrantAccessRequest["AccessMask"];
}

export async function grantAccess(
  params: GrantAccessGenericParams
): Promise<GrantAccessResult> {
  const cfg = getConfigOrThrow();
  const environment = resolveEnvironment(cfg.DYNAMICS_BASE_URL);
  
  const teamId = params.teamId ?? getTeamId(environment);
  const accessMask = params.accessMask ?? "ReadAccess";
  
  const url = `${cfg.DYNAMICS_BASE_URL}/api/data/v9.2/${params.entityName}(${params.entityId})/Microsoft.Dynamics.CRM.GrantAccess`;
  
  const body: GrantAccessRequest = {
    Principal: {
      "teamid@odata.bind": `/teams(${teamId})`,
    },
    AccessMask: accessMask,
  };

  console.log(`[GrantAccess] Condivisione ${params.entityName}/${params.entityId} con team ${teamId} (${accessMask})`);

  try {
    await postAction(url, body);
    
    return {
      success: true,
      activityId: params.entityId,
      teamId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    
    return {
      success: false,
      activityId: params.entityId,
      teamId,
      error: msg,
    };
  }
}
