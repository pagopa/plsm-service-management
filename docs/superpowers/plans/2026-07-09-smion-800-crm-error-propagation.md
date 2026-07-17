# SMION-800 — CRM Error Propagation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Propagate a stable, neutral CRM error contract (`code` + `category` + `step`) from the Azure Function to the frontend so users see a comprehensible Italian message, without coupling the Function to the frontend's language/UX and without exposing CRM schema.

**Architecture:** Approach A — a typed `CrmError` carries raw Dynamics failure detail; a pure `crmErrorMapper` classifies it into neutral codes; the orchestrator attaches the failing `step`; the `meetings` handler emits `error: { code, category, step }` (raw detail stays server-side only). The frontend owns the `code → Italian message` mapping.

**Tech Stack:** TypeScript, Azure Functions v4 (Node 22), Jest (both apps), Next.js 15 server actions.

**Design spec:** `docs/superpowers/specs/2026-07-09-smion-800-crm-error-propagation-design.md`

---

## File Structure

**Function (`apps/sm-crm-fn`):**
- Create `_shared/errors/CrmError.ts` — typed error (`status`, `odataCode`, `rawDetail`, `step`).
- Create `_shared/services/crmErrorMapper.ts` — pure `mapCrmError()` → `CrmErrorInfo`.
- Create `__tests__/crmErrorMapper.test.ts` — one test per branch.
- Modify `_shared/types/dynamics.ts` — add `CrmErrorInfo` + `errorInfo?` on `CreateMeetingOrchestratorResponse`.
- Modify `_shared/services/httpClient.ts` — throw `CrmError` in the `!response.ok` branch.
- Modify `_shared/services/orchestrator.ts` — compute + pass `errorInfo` at each error site and in `buildErrorResponse`.
- Modify `meetings/handler.ts` — emit `error: { code, category, step }`; validation → `VALIDATION_ERROR`.

**Frontend (`apps/sm-fe-smcr`):**
- Create `lib/crm-error-messages.ts` — `code → IT message` dictionary + `getCrmErrorMessage()`.
- Create `lib/__tests__/crm-error-messages.test.ts` — known code + fallback.
- Modify `lib/actions/call-management.action.ts` — read `data.error.code`, return mapped message.

**Docs:**
- Create `apps/sm-crm-fn/docs/FE_ERROR_CODES_GUIDE.md`.
- Modify `apps/sm-crm-fn/docs/API_GUIDE.md` — document the `error` object.

---

## Task 1: Add `CrmError` class and `CrmErrorInfo` type

**Files:**
- Create: `apps/sm-crm-fn/_shared/errors/CrmError.ts`
- Modify: `apps/sm-crm-fn/_shared/types/dynamics.ts` (after `CreateMeetingOrchestratorResponse`, ~line 203)

- [ ] **Step 1: Create the `CrmError` class**

Create `apps/sm-crm-fn/_shared/errors/CrmError.ts`:

```typescript
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
```

- [ ] **Step 2: Add `CrmErrorInfo` type and `errorInfo` field**

In `apps/sm-crm-fn/_shared/types/dynamics.ts`, immediately after the closing `}` of `CreateMeetingOrchestratorResponse` (currently ~line 203), add:

```typescript
export type CrmErrorCategory =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CRM_REJECTED"
  | "CRM_UNAVAILABLE"
  | "UNKNOWN";

export type CrmErrorCode =
  | "VALIDATION_ERROR"
  | "ACCOUNT_NOT_FOUND"
  | "CONTACT_INVALID"
  | "CRM_FIELD_REJECTED"
  | "CRM_UNAVAILABLE"
  | "CRM_ERROR"
  | "UNKNOWN";

export interface CrmErrorInfo {
  code: CrmErrorCode;
  category: CrmErrorCategory;
  step: string;
}
```

Then add `errorInfo` as an optional field inside `CreateMeetingOrchestratorResponse` (after `warnings: string[];`, before `timestamp: string;`):

```typescript
  errorInfo?: CrmErrorInfo;
```

- [ ] **Step 3: Build to verify types compile**

Run: `cd apps/sm-crm-fn && yarn build`
Expected: build succeeds (tsc exits 0), no type errors.

- [ ] **Step 4: Commit**

```bash
git add apps/sm-crm-fn/_shared/errors/CrmError.ts apps/sm-crm-fn/_shared/types/dynamics.ts
git commit -m "feat(SMION-800): add CrmError class and CrmErrorInfo type

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 2: Add `crmErrorMapper` (pure classification)

**Files:**
- Create: `apps/sm-crm-fn/_shared/services/crmErrorMapper.ts`
- Test: `apps/sm-crm-fn/__tests__/crmErrorMapper.test.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/sm-crm-fn/__tests__/crmErrorMapper.test.ts`:

```typescript
import { mapCrmError } from "../_shared/services/crmErrorMapper";
import { CrmError } from "../_shared/errors/CrmError";

describe("mapCrmError", () => {
  it("classifies verifyAccount failures as ACCOUNT_NOT_FOUND", () => {
    expect(mapCrmError({ step: "verifyAccount" })).toEqual({
      code: "ACCOUNT_NOT_FOUND",
      category: "NOT_FOUND",
      step: "verifyAccount",
    });
  });

  it("classifies verifyOrCreateContacts failures as CONTACT_INVALID", () => {
    expect(mapCrmError({ step: "verifyOrCreateContacts" })).toEqual({
      code: "CONTACT_INVALID",
      category: "NOT_FOUND",
      step: "verifyOrCreateContacts",
    });
  });

  it("classifies a Dynamics field-rejection OData code as CRM_FIELD_REJECTED", () => {
    const error = new CrmError({
      status: 400,
      odataCode: "0x80040265",
      rawDetail: "The entity field xyz is invalid",
      step: "createAppointment",
    });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_FIELD_REJECTED",
      category: "CRM_REJECTED",
      step: "createAppointment",
    });
  });

  it("classifies Dynamics 5xx as CRM_UNAVAILABLE", () => {
    const error = new CrmError({ status: 503, step: "createAppointment" });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_UNAVAILABLE",
      category: "CRM_UNAVAILABLE",
      step: "createAppointment",
    });
  });

  it("falls back to CRM_ERROR for an unclassified createAppointment failure", () => {
    const error = new CrmError({ status: 400, step: "createAppointment" });
    expect(mapCrmError({ step: "createAppointment", error })).toEqual({
      code: "CRM_ERROR",
      category: "UNKNOWN",
      step: "createAppointment",
    });
  });

  it("falls back to UNKNOWN for an unrecognised step without error", () => {
    expect(mapCrmError({ step: "somethingElse" })).toEqual({
      code: "UNKNOWN",
      category: "UNKNOWN",
      step: "somethingElse",
    });
  });

  it("never leaks rawDetail into the mapped output", () => {
    const error = new CrmError({
      status: 400,
      odataCode: "0x80040265",
      rawDetail: "SECRET schema attribute pgp_internal",
      step: "createAppointment",
    });
    const result = mapCrmError({ step: "createAppointment", error });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(JSON.stringify(result)).not.toContain("rawDetail");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/sm-crm-fn && yarn jest crmErrorMapper -c`
Expected: FAIL — cannot find module `../_shared/services/crmErrorMapper`.

- [ ] **Step 3: Write the implementation**

Create `apps/sm-crm-fn/_shared/services/crmErrorMapper.ts`:

```typescript
import { CrmError } from "../errors/CrmError";
import type { CrmErrorInfo } from "../types/dynamics";

/**
 * Codici OData Dynamics che indicano un valore/campo rifiutato dal CRM
 * (schema, optionset, campo inesistente o non valido).
 */
const FIELD_REJECTION_ODATA_CODES = new Set<string>([
  "0x80040265",
  "0x80040217",
  "0x8004431a",
]);

/**
 * Classifica un fallimento CRM in un codice d'errore neutro e stabile.
 *
 * Funzione pura: non conosce HTTP né testi user-facing. Il `rawDetail`
 * dell'eventuale CrmError NON viene mai incluso nell'output.
 *
 * @param params.step - Step del flusso in cui è avvenuto l'errore.
 * @param params.error - Errore risalito (tipicamente un CrmError), opzionale.
 * @returns Informazione d'errore neutra { code, category, step }.
 */
export function mapCrmError(params: {
  step: string;
  error?: unknown;
}): CrmErrorInfo {
  const { step, error } = params;

  if (error instanceof CrmError) {
    if (error.status >= 500 || error.status === 0) {
      return { code: "CRM_UNAVAILABLE", category: "CRM_UNAVAILABLE", step };
    }
    if (error.odataCode && FIELD_REJECTION_ODATA_CODES.has(error.odataCode)) {
      return { code: "CRM_FIELD_REJECTED", category: "CRM_REJECTED", step };
    }
  }

  switch (step) {
    case "verifyAccount":
      return { code: "ACCOUNT_NOT_FOUND", category: "NOT_FOUND", step };
    case "verifyOrCreateContacts":
      return { code: "CONTACT_INVALID", category: "NOT_FOUND", step };
    case "createAppointment":
      return { code: "CRM_ERROR", category: "UNKNOWN", step };
    default:
      return { code: "UNKNOWN", category: "UNKNOWN", step };
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/sm-crm-fn && yarn jest crmErrorMapper -c`
Expected: PASS — 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/crmErrorMapper.ts apps/sm-crm-fn/__tests__/crmErrorMapper.test.ts
git commit -m "feat(SMION-800): add crmErrorMapper pure classifier with tests

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 3: `httpClient.post` throws `CrmError`

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/httpClient.ts` (import at top ~line 9; `!response.ok` branch ~line 278-287)

- [ ] **Step 1: Add the import**

In `apps/sm-crm-fn/_shared/services/httpClient.ts`, add after the existing type import (line 8 `import type { DynamicsList } ...`):

```typescript
import { CrmError } from "../errors/CrmError";
```

- [ ] **Step 2: Replace the raw throw in the `!response.ok` branch**

In `post()`, replace this block (currently ~lines 278-287):

```typescript
    if (!response.ok) {
      const errorBody = await response.text();
      logger.error(`POST request failed`, new Error(errorBody), {
        url,
        statusCode: response.status,
        duration,
        method: "POST",
      });
      throw new Error(`POST ${url} failed: ${response.status} - ${errorBody}`);
    }
```

with:

```typescript
    if (!response.ok) {
      const errorBody = await response.text();
      let odataCode: string | undefined;
      try {
        const parsed = JSON.parse(errorBody) as {
          error?: { code?: string };
        };
        odataCode = parsed.error?.code;
      } catch {
        odataCode = undefined;
      }
      // rawDetail resta SOLO nei log server-side, mai nella risposta HTTP.
      logger.error(`POST request failed`, new Error(errorBody), {
        url,
        statusCode: response.status,
        duration,
        method: "POST",
      });
      throw new CrmError({
        status: response.status,
        odataCode,
        rawDetail: errorBody,
        message: `POST ${url} failed: ${response.status}`,
      });
    }
```

- [ ] **Step 3: Verify the existing `0x80040265` fallback still triggers**

The fallback in `appointments.ts` (~line 437) checks `errorMessage.includes("0x80040265")`. Since `CrmError.message` no longer contains the OData code, update that check to use the typed field.

In `apps/sm-crm-fn/_shared/services/appointments.ts`, view lines 430-450 and replace the guard:

```typescript
    if (!errorMessage.includes("0x80040265")) {
```

with a `CrmError`-aware check. First add the import near the top of `appointments.ts` (with the other imports):

```typescript
import { CrmError } from "../errors/CrmError";
```

Then replace the guard block. Locate the `catch (error)` that wraps the appointment creation retry and change the condition to:

```typescript
    const odataCode = error instanceof CrmError ? error.odataCode : undefined;
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (odataCode !== "0x80040265" && !errorMessage.includes("0x80040265")) {
```

(Keep the rest of the fallback body unchanged. The `errorMessage.includes` clause preserves behavior for any non-CrmError path.)

- [ ] **Step 4: Build and run the full Function test suite**

Run: `cd apps/sm-crm-fn && yarn build && yarn jest -c`
Expected: build succeeds; all tests pass (config, appointmentPersistence, crmErrorMapper).

- [ ] **Step 5: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/httpClient.ts apps/sm-crm-fn/_shared/services/appointments.ts
git commit -m "feat(SMION-800): throw typed CrmError from httpClient.post

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 4: Orchestrator propagates `errorInfo`

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/orchestrator.ts` (imports; `buildErrorResponse` ~line 664; error sites ~lines 166, 196, 378-397, 417+)

- [ ] **Step 1: Add imports**

At the top of `apps/sm-crm-fn/_shared/services/orchestrator.ts`, add:

```typescript
import { mapCrmError } from "./crmErrorMapper";
import type { CrmErrorInfo } from "../types/dynamics";
```

- [ ] **Step 2: Extend `buildErrorResponse` to accept and emit `errorInfo`**

Change the signature of `buildErrorResponse` (~line 664) to add a parameter:

```typescript
async function buildErrorResponse(
  steps: OrchestratorStepResult[],
  warnings: string[],
  dryRun: boolean,
  errorMessage: string,
  errorInfo: CrmErrorInfo,
  diagnosticSession?: DiagnosticSession,
): Promise<CreateMeetingOrchestratorResponse> {
```

Inside, add `errorInfo` to the constructed `response` object (after `warnings,`):

```typescript
  const response: CreateMeetingOrchestratorResponse = {
    success: false,
    dryRun,
    steps,
    warnings,
    errorInfo,
    timestamp: new Date().toISOString(),
  };
```

- [ ] **Step 3: Pass `errorInfo` at the verifyAccount exception site (~line 166)**

Replace the `return buildErrorResponse(...)` call inside the `catch (error)` of STEP 1 (currently ~line 166-172) with:

```typescript
      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        `Errore durante verifica ente: ${msg}`,
        mapCrmError({ step: "verifyAccount", error }),
        diagnosticSession,
      );
```

- [ ] **Step 4: Pass `errorInfo` at the verifyAccount not-found site (~line 196)**

Replace the `return buildErrorResponse(...)` call in the `if (!accountResult.found ...)` block (currently ~line 196-202) with:

```typescript
      return buildErrorResponse(
        steps,
        warnings,
        dryRun,
        accountResult.error ?? "Ente non trovato",
        mapCrmError({ step: "verifyAccount" }),
        diagnosticSession,
      );
```

- [ ] **Step 5: Pass `errorInfo` at the contacts and appointment error sites**

For every remaining `return buildErrorResponse(...)` in this file, add the `mapCrmError({...})` argument before `diagnosticSession`, using the step matching that block:
- Contacts block(s) (~line 378-397 and the surrounding `catch (error)` ~line 417): use `mapCrmError({ step: "verifyOrCreateContacts", error })` (include `error` only where an `error` variable exists in scope; otherwise omit it).
- Appointment creation block: use `mapCrmError({ step: "createAppointment", error })`.

View each `return buildErrorResponse(` occurrence (`grep -n "buildErrorResponse" apps/sm-crm-fn/_shared/services/orchestrator.ts`) and insert the correct argument so every call passes 6 arguments.

- [ ] **Step 6: Build to verify all call sites are updated**

Run: `cd apps/sm-crm-fn && yarn build`
Expected: build succeeds. If tsc reports "Expected 6 arguments, but got 5" at any `buildErrorResponse` call, fix that call site.

- [ ] **Step 7: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/orchestrator.ts
git commit -m "feat(SMION-800): propagate errorInfo from orchestrator error sites

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 5: `meetings/handler.ts` emits the `error` object

**Files:**
- Modify: `apps/sm-crm-fn/meetings/handler.ts` (validation branch ~line 44-52; result branch ~line 75-85; catch ~line 100-110)

- [ ] **Step 1: Emit `error` on the validation branch**

In `createMeetingHandler`, replace the validation-failure return (currently ~line 44-52):

```typescript
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors,
          timestamp: new Date().toISOString(),
        },
      };
```

with:

```typescript
      return {
        status: 400,
        jsonBody: {
          success: false,
          message: "Errore di validazione",
          errors,
          error: {
            code: "VALIDATION_ERROR",
            category: "VALIDATION",
            step: "validation",
          },
          timestamp: new Date().toISOString(),
        },
      };
```

- [ ] **Step 2: Emit `error` on the orchestrator-failure branch**

Replace the main result return (currently ~line 75-85) with a version that includes `errorInfo` when the orchestrator failed:

```typescript
    return {
      status,
      jsonBody: {
        ...result,
        ...(result.success ? {} : { error: result.errorInfo }),
        message: result.success
          ? result.dryRun
            ? "Dry-run completato con successo"
            : "Appuntamento creato con successo"
          : "Errore durante la creazione dell'appuntamento",
      },
    };
```

(`...result` already includes `errorInfo`; the explicit `error` field mirrors it under the contract name `error` for the frontend. Raw Dynamics detail is never part of `result`, so nothing sensitive is emitted.)

- [ ] **Step 3: Emit `error` on the unexpected-catch branch**

Replace the final catch return (currently ~line 102-110) with:

```typescript
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        message: "Errore interno del server",
        error: {
          code: "CRM_ERROR",
          category: "UNKNOWN",
          step: "unexpected",
        },
        timestamp: new Date().toISOString(),
      },
    };
```

(Note: `errorMessage` is still logged via `context.error("Unexpected error:", error)` above; it must NOT be placed in `jsonBody`.)

- [ ] **Step 4: Build and run the Function test suite**

Run: `cd apps/sm-crm-fn && yarn build && yarn jest -c`
Expected: build succeeds; all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/sm-crm-fn/meetings/handler.ts
git commit -m "feat(SMION-800): emit neutral error object from meetings handler

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 6: Frontend `code → Italian message` mapping

**Files:**
- Create: `apps/sm-fe-smcr/lib/crm-error-messages.ts`
- Test: `apps/sm-fe-smcr/lib/__tests__/crm-error-messages.test.ts`
- Modify: `apps/sm-fe-smcr/lib/actions/call-management.action.ts` (type ~line 292; failure return ~line 458)

- [ ] **Step 1: Write the failing test**

Create `apps/sm-fe-smcr/lib/__tests__/crm-error-messages.test.ts`:

```typescript
import { getCrmErrorMessage } from "../crm-error-messages";

describe("getCrmErrorMessage", () => {
  it("returns the Italian message for a known code", () => {
    expect(getCrmErrorMessage("ACCOUNT_NOT_FOUND")).toBe(
      "Ente non trovato nel CRM. Verifica l'ente selezionato.",
    );
  });

  it("returns the generic fallback for an unknown code", () => {
    expect(getCrmErrorMessage("SOMETHING_NEW")).toBe(
      "Errore CRM. Riprova più tardi o contatta il supporto.",
    );
  });

  it("returns the generic fallback when code is undefined", () => {
    expect(getCrmErrorMessage(undefined)).toBe(
      "Errore CRM. Riprova più tardi o contatta il supporto.",
    );
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/sm-fe-smcr && yarn jest crm-error-messages`
Expected: FAIL — cannot find module `../crm-error-messages`.

- [ ] **Step 3: Write the implementation**

Create `apps/sm-fe-smcr/lib/crm-error-messages.ts`:

```typescript
const GENERIC_CRM_ERROR =
  "Errore CRM. Riprova più tardi o contatta il supporto.";

/**
 * Mappa i codici d'errore neutri emessi dalla Azure Function (contratto
 * SMION-800) sui messaggi mostrati all'utente in italiano. Unico punto
 * dell'applicazione in cui i codici CRM diventano testo user-facing.
 */
const CRM_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    "Alcuni dati inseriti non sono validi. Controlla i campi e riprova.",
  ACCOUNT_NOT_FOUND: "Ente non trovato nel CRM. Verifica l'ente selezionato.",
  CONTACT_INVALID:
    "Contatto non valido o non trovato nel CRM. Verifica i partecipanti.",
  CRM_FIELD_REJECTED:
    "Il CRM ha rifiutato uno dei valori inviati. Contatta il supporto.",
  CRM_UNAVAILABLE:
    "Il CRM non è al momento raggiungibile. Riprova più tardi.",
  CRM_ERROR: GENERIC_CRM_ERROR,
  UNKNOWN: GENERIC_CRM_ERROR,
};

/**
 * Restituisce il messaggio italiano per un codice d'errore CRM, con
 * fallback generico per codici sconosciuti o assenti.
 */
export function getCrmErrorMessage(code?: string): string {
  if (code && code in CRM_ERROR_MESSAGES) {
    return CRM_ERROR_MESSAGES[code];
  }
  return GENERIC_CRM_ERROR;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd apps/sm-fe-smcr && yarn jest crm-error-messages`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Wire the action to use the code**

In `apps/sm-fe-smcr/lib/actions/call-management.action.ts`:

(a) Add the import near the top with the other `lib` imports:

```typescript
import { getCrmErrorMessage } from "@/lib/crm-error-messages";
```

(b) Extend the `CreateMeetingResponse` type (~line 292) to include the neutral error object:

```typescript
type CreateMeetingResponse = {
  activityId?: string;
  message?: string;
  error?: unknown;
  errorCode?: string;
};
```

Note: the Function sends `error: { code, category, step }`. Extract the code defensively.

(c) In the `if (!res.ok)` block, after computing the existing `message` variable and before `logger.error(...)` (currently ~line 429-458), compute the neutral code and prefer the mapped message. Replace the `return { success: false, error: message };` (line ~458) with:

```typescript
      const neutralCode =
        data.error &&
        typeof data.error === "object" &&
        data.error !== null &&
        "code" in data.error &&
        typeof (data.error as { code?: unknown }).code === "string"
          ? (data.error as { code: string }).code
          : undefined;

      return {
        success: false,
        error: neutralCode ? getCrmErrorMessage(neutralCode) : message,
      };
```

(This preserves the legacy `message` fallback when no neutral `code` is present — no regression.)

- [ ] **Step 6: Run FE tests and typecheck**

Run: `cd apps/sm-fe-smcr && yarn jest crm-error-messages && yarn build`
Expected: tests pass; Next.js build/typecheck succeeds.

- [ ] **Step 7: Commit**

```bash
git add apps/sm-fe-smcr/lib/crm-error-messages.ts apps/sm-fe-smcr/lib/__tests__/crm-error-messages.test.ts apps/sm-fe-smcr/lib/actions/call-management.action.ts
git commit -m "feat(SMION-800): map neutral CRM error codes to Italian messages on FE

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Task 7: Documentation — FE error-codes guide

**Files:**
- Create: `apps/sm-crm-fn/docs/FE_ERROR_CODES_GUIDE.md`
- Modify: `apps/sm-crm-fn/docs/API_GUIDE.md` (add the `error` object to the `POST /meetings` error response section)

- [ ] **Step 1: Create the FE guide**

Create `apps/sm-crm-fn/docs/FE_ERROR_CODES_GUIDE.md`:

````markdown
# Guida errori CRM per il Frontend (SMION-800)

Quando `POST /meetings` fallisce, la Function restituisce un oggetto `error`
**neutro e stabile**. Il frontend è responsabile della traduzione in messaggi
user-facing (italiano). Il dettaglio grezzo di Dynamics NON è mai incluso nella
risposta: resta solo nei log server-side.

## Forma della risposta di errore

```jsonc
{
  "success": false,
  "message": "Errore durante la creazione dell'appuntamento", // legacy
  "error": {
    "code": "ACCOUNT_NOT_FOUND",
    "category": "NOT_FOUND",
    "step": "verifyAccount"
  },
  "timestamp": "2026-07-09T..."
}
```

## Catalogo codici

| `code` | `category` | HTTP | Quando accade | Messaggio IT suggerito |
|--------|-----------|------|---------------|------------------------|
| `VALIDATION_ERROR` | `VALIDATION` | 400 | Payload non valido | Alcuni dati inseriti non sono validi. Controlla i campi e riprova. |
| `ACCOUNT_NOT_FOUND` | `NOT_FOUND` | 500 | Ente non risolto | Ente non trovato nel CRM. Verifica l'ente selezionato. |
| `CONTACT_INVALID` | `NOT_FOUND` | 500 | Contatto non trovato/creabile | Contatto non valido o non trovato nel CRM. Verifica i partecipanti. |
| `CRM_FIELD_REJECTED` | `CRM_REJECTED` | 500 | Dynamics rifiuta un campo/valore | Il CRM ha rifiutato uno dei valori inviati. Contatta il supporto. |
| `CRM_UNAVAILABLE` | `CRM_UNAVAILABLE` | 500 | Timeout / 5xx Dynamics | Il CRM non è al momento raggiungibile. Riprova più tardi. |
| `CRM_ERROR` | `UNKNOWN` | 500 | Errore CRM non classificato | Errore CRM. Riprova più tardi o contatta il supporto. |
| `UNKNOWN` | `UNKNOWN` | 500 | Fallback estremo | Errore CRM. Riprova più tardi o contatta il supporto. |

## Come consumarlo lato FE

1. Leggi `data.error?.code`.
2. Mappa il `code` sul messaggio italiano (vedi `lib/crm-error-messages.ts`).
3. Per un `code` sconosciuto, usa il fallback generico.
4. Se `error` è assente (es. risposta legacy), usa `data.message`.

## Retro-compatibilità

- Il campo `message` resta presente. I client che non conoscono `error` continuano
  a funzionare.
- Nuovi codici possono essere aggiunti in futuro: il FE deve sempre prevedere il
  fallback generico per codici non riconosciuti.
````

- [ ] **Step 2: Update `API_GUIDE.md`**

Open `apps/sm-crm-fn/docs/API_GUIDE.md`, find the `POST /meetings` error-response documentation, and add a short subsection describing the `error: { code, category, step }` object, linking to `FE_ERROR_CODES_GUIDE.md`. If no error-response section exists, add one under the `POST /meetings` heading:

```markdown
### Risposta di errore

In caso di fallimento, la risposta include un oggetto `error` neutro:

```json
{ "success": false, "error": { "code": "ACCOUNT_NOT_FOUND", "category": "NOT_FOUND", "step": "verifyAccount" } }
```

Il catalogo completo dei codici è in [`FE_ERROR_CODES_GUIDE.md`](./FE_ERROR_CODES_GUIDE.md).
```

- [ ] **Step 3: Commit**

```bash
git add apps/sm-crm-fn/docs/FE_ERROR_CODES_GUIDE.md apps/sm-crm-fn/docs/API_GUIDE.md
git commit -m "docs(SMION-800): add FE error-codes guide and update API guide

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
```

---

## Final Verification

- [ ] **Function CI parity**

Run: `cd /Users/lorenzo.franceschini/dev/pagopa/plsm-service-management && yarn turbo lint --filter=sm-crm-fn && yarn turbo test --filter=sm-crm-fn && yarn turbo build --filter=sm-crm-fn`
Expected: all green.

- [ ] **Frontend build + targeted tests**

Run: `yarn turbo test --filter=sm-fe-smcr && yarn turbo build --filter=sm-fe-smcr`
Expected: tests pass, build succeeds.

- [ ] **Prettier**

Run: `yarn prettier --check "apps/sm-crm-fn/**/*.ts" "apps/sm-fe-smcr/lib/**/*.ts"`
Expected: all matched files use Prettier code style.
