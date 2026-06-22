# SM CRM Diagnostics Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere i blob diagnostici di `apps/sm-crm-fn` leggibili end-to-end, mostrando il payload frontend, tutte le chiamate intermedie verso Dynamics e il payload finale di creazione meeting.

**Architecture:** L'implementazione estende il contratto di `DiagnosticSession` in `_shared/services/diagnosticLogger.ts` con un formato piu' ricco ma retrocompatibile. I servizi `accounts`, `contacts`, `appointments` e l'`orchestrator` continueranno a emettere eventi diagnostici, ma con metadata uniformi (`sequence`, `substep`, `entity`, `requestDetails`, `derivedFromFrontend`, `success`) e con una nuova sezione `flowSummary` costruita una sola volta lato orchestratore.

**Tech Stack:** TypeScript, Azure Functions, Azure Blob Storage, Dynamics 365 OData, Yarn workspace `sm-crm-fn`

---

## File structure

- Modify: `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts`
  - Estende i tipi diagnostici (`DiagnosticCall`, `DiagnosticSession`) e centralizza `sequence`, `flowSummary` e sanitizzazione.
- Modify: `apps/sm-crm-fn/_shared/services/accounts.ts`
  - Arricchisce i log delle query account con `substep`, `entity`, `requestDetails`, `derivedFromFrontend`, `success`.
- Modify: `apps/sm-crm-fn/_shared/services/contacts.ts`
  - Arricchisce i log di ricerca/creazione contatto e collega i record al partecipante corretto.
- Modify: `apps/sm-crm-fn/_shared/services/appointments.ts`
  - Logga il payload completo di `POST /appointments`, inclusi binding account/prodotto e tentativi fallback.
- Modify: `apps/sm-crm-fn/_shared/services/orchestrator.ts`
  - Costruisce `flowSummary`, alimenta i dati derivati e chiude la sessione diagnostica.
- Verify: `apps/sm-crm-fn/package.json`
  - Usa lo script esistente `yarn workspace sm-crm-fn build`.

> Nota: `sm-crm-fn` non ha un framework di test automatizzati configurato. Questo piano usa build TypeScript e verifica manuale del blob JSON come strategia di validazione.

### Task 1: Estendere il contratto diagnostico

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts`
- Verify: `apps/sm-crm-fn/package.json`

- [ ] **Step 1: Aggiornare i tipi diagnostici con il nuovo schema**

Inserire in `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts` un contratto simile a questo:

```ts
export interface DiagnosticRequestDetails {
  entity?: string;
  filter?: string;
  select?: string;
  top?: string;
}

export interface DiagnosticDerivedFromFrontend {
  institutionIdSelfcare?: string;
  productIdSelfcare?: string;
  accountId?: string;
  productGuid?: string | null;
  participantIndex?: number;
  participantEmail?: string;
  notes?: string[];
}

export interface DiagnosticCall {
  sequence: number;
  step: string;
  substep: string;
  entity: "accounts" | "contacts" | "appointments";
  attempt: number;
  participantRef?: {
    index: number;
    email?: string;
  };
  method: "GET" | "POST";
  url: string;
  requestDetails?: DiagnosticRequestDetails;
  requestBody: unknown | null;
  derivedFromFrontend?: DiagnosticDerivedFromFrontend;
  responseStatus: number | null;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface DiagnosticFlowSummary {
  frontendRequest: unknown;
  derivedData: {
    account?: {
      accountId: string;
      accountName: string;
      resolutionMethod: string;
    };
    product?: {
      productIdSelfcare?: string;
      environment: string;
      productGuid?: string | null;
    };
    contacts: Array<{
      participantIndex: number;
      email?: string;
      contactId?: string;
      status: "found" | "created" | "failed";
    }>;
    appointmentBindings?: Record<string, string | undefined>;
  };
  finalDynamicsRequest?: {
    method: "POST";
    url: string;
    requestBody: unknown;
    derivedFromFrontend?: DiagnosticDerivedFromFrontend;
  };
  flowSteps: Array<{
    sequence: number;
    step: string;
    status: "started" | "completed" | "failed";
    summary: string;
  }>;
  result?: unknown;
}

export interface DiagnosticSession {
  sessionId: string;
  timestamp: string;
  environment: string;
  frontendPayload: unknown;
  flowSummary: DiagnosticFlowSummary;
  dynamicsCalls: DiagnosticCall[];
  orchestratorResult?: unknown;
  nextSequence: number;
}
```

- [ ] **Step 2: Aggiornare la factory della sessione diagnostica**

Sostituire `createDiagnosticSession(...)` con una versione che inizializza `flowSummary` e il contatore:

```ts
export function createDiagnosticSession(
  frontendPayload: unknown,
  environment: string,
): DiagnosticSession {
  return {
    sessionId: randomUUID(),
    timestamp: new Date().toISOString(),
    environment,
    frontendPayload,
    flowSummary: {
      frontendRequest: frontendPayload,
      derivedData: {
        product: { environment },
        contacts: [],
      },
      flowSteps: [],
    },
    dynamicsCalls: [],
    nextSequence: 1,
  };
}
```

- [ ] **Step 3: Rendere `addDiagnosticCall(...)` responsabile della sequence**

Aggiornare `addDiagnosticCall(...)` cosi':

```ts
export function addDiagnosticCall(
  session: DiagnosticSession,
  call: Omit<DiagnosticCall, "sequence">,
): void {
  session.dynamicsCalls.push({
    ...call,
    sequence: session.nextSequence++,
  });
}
```

- [ ] **Step 4: Sanitizzare anche `flowSummary` senza mascherare i campi tecnici**

Aggiornare `buildPersistedDiagnosticSession(...)` per includere la nuova sezione:

```ts
function buildPersistedDiagnosticSession(
  session: DiagnosticSession,
): DiagnosticSession {
  return {
    ...session,
    frontendPayload: sanitizeDiagnosticValue(session.frontendPayload, "frontendPayload"),
    flowSummary: sanitizeDiagnosticValue(session.flowSummary, "flowSummary") as DiagnosticFlowSummary,
    dynamicsCalls: session.dynamicsCalls.map((call) => ({
      ...call,
      url: sanitizeDiagnosticString(call.url),
      requestDetails: sanitizeDiagnosticValue(call.requestDetails, "requestDetails") as DiagnosticRequestDetails,
      requestBody: sanitizeDiagnosticValue(call.requestBody, "requestBody"),
      derivedFromFrontend: sanitizeDiagnosticValue(call.derivedFromFrontend, "derivedFromFrontend") as DiagnosticDerivedFromFrontend,
      error: call.error ? sanitizeDiagnosticString(call.error) : undefined,
    })),
    orchestratorResult: sanitizeDiagnosticValue(session.orchestratorResult, "orchestratorResult"),
  };
}
```

- [ ] **Step 5: Aggiornare le regole di masking per non oscurare GUID e `@odata.bind`**

Verificare che `PARTIALLY_MASKED_FIELDS` resti limitato ai campi personali e non includa chiavi tecniche. Il blocco deve restare concettualmente cosi':

```ts
const PARTIALLY_MASKED_FIELDS = new Set([
  "email",
  "emailaddress1",
  "firstname",
  "lastname",
  "nome",
  "cognome",
  "subject",
  "description",
  "location",
]);
```

- [ ] **Step 6: Eseguire la build per confermare il nuovo contratto**

Run:

```bash
yarn workspace sm-crm-fn build
```

Expected: build TypeScript completata senza errori.

- [ ] **Step 7: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/diagnosticLogger.ts
git commit -m "refactor(sm-crm-fn): enrich diagnostic session contract"
```

### Task 2: Rendere completi i log account verso Dynamics

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/accounts.ts`
- Modify: `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts`
- Verify: `apps/sm-crm-fn/package.json`

- [ ] **Step 1: Aggiornare il log di `getAccountBySelfcareId(...)`**

Sostituire la `addDiagnosticCall(...)` di successo con una forma completa:

```ts
addDiagnosticCall(diagnosticSession, {
  step: "verifyAccount",
  substep: "getAccountBySelfcareId",
  entity: "accounts",
  attempt: 1,
  method: "GET",
  url,
  requestDetails: {
    entity: "accounts",
    filter,
    select,
  },
  requestBody: null,
  derivedFromFrontend: {
    institutionIdSelfcare,
    notes: ["institutionIdSelfcare -> account lookup filter"],
  },
  responseStatus: 200,
  durationMs: Date.now() - startMs,
  success: true,
});
```

- [ ] **Step 2: Aggiornare anche il ramo errore di `getAccountBySelfcareId(...)`**

```ts
addDiagnosticCall(diagnosticSession, {
  step: "verifyAccount",
  substep: "getAccountBySelfcareId",
  entity: "accounts",
  attempt: 1,
  method: "GET",
  url,
  requestDetails: {
    entity: "accounts",
    filter,
    select,
  },
  requestBody: null,
  derivedFromFrontend: {
    institutionIdSelfcare,
  },
  responseStatus: null,
  durationMs: Date.now() - startMs,
  success: false,
  error: error instanceof Error ? error.message : String(error),
});
```

- [ ] **Step 3: Applicare lo stesso schema a `getAccountByName(...)`**

Usare un payload analogo ma con `substep: "getAccountByName"` e `derivedFromFrontend.nomeEnte`:

```ts
derivedFromFrontend: {
  notes: ["nomeEnte -> fallback account lookup filter"],
}
```

- [ ] **Step 4: Eseguire la build per verificare i nuovi tipi**

Run:

```bash
yarn workspace sm-crm-fn build
```

Expected: build TypeScript completata senza errori.

- [ ] **Step 5: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/accounts.ts apps/sm-crm-fn/_shared/services/diagnosticLogger.ts
git commit -m "feat(sm-crm-fn): enrich account diagnostic calls"
```

### Task 3: Rendere completi e tracciabili i log contact

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/contacts.ts`
- Modify: `apps/sm-crm-fn/_shared/services/orchestrator.ts`
- Verify: `apps/sm-crm-fn/package.json`

- [ ] **Step 1: Definire il riferimento partecipante da propagare ai log**

Nel loop dei partecipanti in `apps/sm-crm-fn/_shared/services/orchestrator.ts`, preparare un oggetto da passare al servizio contatti:

```ts
const participantRef = {
  index,
  email: partecipante.email,
};

const contactResult = await verifyOrCreateContact({
  baseUrl: request.baseUrl,
  email: partecipante.email,
  nome: partecipante.nome,
  cognome: partecipante.cognome,
  institutionIdSelfcare: request.institutionIdSelfcare,
  productIdSelfcare: request.productIdSelfcare as ProductIdSelfcare,
  tipologiaReferente: (partecipante.tipologiaReferente ?? "TECNICO") as TipologiaReferente,
  accountId,
  enableCreateContact: request.enableCreateContact ?? false,
  diagnosticSession,
  participantRef,
});
```

- [ ] **Step 2: Estendere i parametri di `verifyOrCreateContact(...)`**

Nel tipo params di `verifyOrCreateContact(...)` aggiungere:

```ts
participantRef?: {
  index: number;
  email?: string;
};
```

- [ ] **Step 3: Arricchire le tre ricerche `GET /contacts`**

Per ogni `addDiagnosticCall(...)` di:
- `searchContactByInstitution`
- `searchContactByProduct`
- `searchContactByEmailOnly`

usare una struttura completa come:

```ts
addDiagnosticCall(params.diagnosticSession, {
  step: "verifyOrCreateContact",
  substep: "searchContactByInstitution",
  entity: "contacts",
  attempt: 1,
  participantRef: params.participantRef,
  method: "GET",
  url: step1Url,
  requestDetails: {
    entity: "contacts",
    filter: `pgp_identificativoselfcarecliente eq '${params.institutionIdSelfcare}' and emailaddress1 eq '${params.email?.replace(/'/g, "''")}' and contains(pgp_identificativoidpagopa, '${params.productIdSelfcare}')`,
    select: "contactid,fullname,emailaddress1,firstname,lastname",
  },
  requestBody: null,
  derivedFromFrontend: {
    institutionIdSelfcare: params.institutionIdSelfcare,
    productIdSelfcare: params.productIdSelfcare,
    participantIndex: params.participantRef?.index,
    participantEmail: params.participantRef?.email,
    notes: ["participant email + institutionIdSelfcare + productIdSelfcare -> contact search"],
  },
  responseStatus: 200,
  durationMs: Date.now() - step1Start,
  success: true,
});
```

- [ ] **Step 4: Rendere completo anche il log di `createContact`**

Tenere il `requestBody` completo anche in caso di errore:

```ts
const contactBody: CreateContactRequest = {
  firstname: params.nome,
  lastname: params.cognome,
  pgp_tipologiareferente: tipologiaId,
  "parentcustomerid_account@odata.bind": `/accounts(${params.accountId})`,
  ...(prodGuid ? { "pgp_Prodottoid@odata.bind": `/products(${prodGuid})` } : {}),
  ...(params.email ? { emailaddress1: params.email } : {}),
};

addDiagnosticCall(params.diagnosticSession, {
  step: "verifyOrCreateContact",
  substep: "createContact",
  entity: "contacts",
  attempt: 1,
  participantRef: params.participantRef,
  method: "POST",
  url: `${params.baseUrl}/api/data/v9.2/contacts`,
  requestBody: contactBody,
  derivedFromFrontend: {
    accountId: params.accountId,
    productIdSelfcare: params.productIdSelfcare,
    productGuid: prodGuid,
    participantIndex: params.participantRef?.index,
    participantEmail: params.participantRef?.email,
  },
  responseStatus: 201,
  durationMs: Date.now() - createStart,
  success: true,
});
```

Nel catch, riusare `contactBody` invece di `null`.

- [ ] **Step 5: Aggiornare `flowSummary.derivedData.contacts` nel loop orchestratore**

Dopo ogni esito contatto, aggiungere:

```ts
diagnosticSession?.flowSummary.derivedData.contacts.push({
  participantIndex: index,
  email: partecipante.email,
  contactId: contactResult.contact?.contactid,
  status: contactResult.contact
    ? (contactResult.created ? "created" : "found")
    : "failed",
});
```

- [ ] **Step 6: Eseguire la build**

Run:

```bash
yarn workspace sm-crm-fn build
```

Expected: build TypeScript completata senza errori.

- [ ] **Step 7: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/contacts.ts apps/sm-crm-fn/_shared/services/orchestrator.ts
git commit -m "feat(sm-crm-fn): trace contact diagnostics by participant"
```

### Task 4: Rendere esplicita la POST finale di createAppointment

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/appointments.ts`
- Modify: `apps/sm-crm-fn/_shared/services/orchestrator.ts`
- Verify: `apps/sm-crm-fn/package.json`

- [ ] **Step 1: Preparare metadata derivati prima della POST appointment**

In `apps/sm-crm-fn/_shared/services/appointments.ts`, dopo il calcolo di `productGuid`, costruire:

```ts
const environment = resolveEnvironment(params.baseUrl);
const productGuid = params.productIdSelfcare
  ? getProductGuid(params.productIdSelfcare, environment)
  : null;

const appointmentDerivedFromFrontend = {
  accountId: params.accountId,
  productIdSelfcare: params.productIdSelfcare,
  productGuid,
  notes: [
    "accountId -> regardingobjectid_account@odata.bind",
    "accountId -> pgp_clienteid_Appointment@odata.bind",
    "productIdSelfcare -> productGuid -> pgp_prodottooggettodelcontattoid_Appointment@odata.bind",
  ],
};
```

- [ ] **Step 2: Arricchire `executeCreateAppointment(...)` con record completo**

Aggiornare il log di successo:

```ts
addDiagnosticCall(params.diagnosticSession, {
  step,
  substep: step,
  entity: "appointments",
  attempt: step === "createAppointmentFallback" ? 2 : 1,
  method: "POST",
  url,
  requestBody,
  derivedFromFrontend: appointmentDerivedFromFrontend,
  responseStatus: 201,
  durationMs: Date.now() - attemptStart,
  success: true,
});
```

E il log errore:

```ts
addDiagnosticCall(params.diagnosticSession, {
  step,
  substep: step,
  entity: "appointments",
  attempt: step === "createAppointmentFallback" ? 2 : 1,
  method: "POST",
  url,
  requestBody,
  derivedFromFrontend: appointmentDerivedFromFrontend,
  responseStatus: null,
  durationMs: Date.now() - attemptStart,
  success: false,
  error: errorMessage,
});
```

- [ ] **Step 3: Aggiornare `flowSummary.finalDynamicsRequest` e `appointmentBindings`**

In `orchestrator.ts`, subito dopo il successo di `createAppointment(...)`, valorizzare:

```ts
if (diagnosticSession) {
  diagnosticSession.flowSummary.derivedData.appointmentBindings = {
    "regardingobjectid_account@odata.bind": `/accounts(${accountId})`,
    "pgp_clienteid_Appointment@odata.bind": `/accounts(${accountId})`,
    "pgp_prodottooggettodelcontattoid_Appointment@odata.bind": productGuid
      ? `/products(${productGuid})`
      : undefined,
  };

  diagnosticSession.flowSummary.finalDynamicsRequest = {
    method: "POST",
    url: `${request.baseUrl}/api/data/v9.2/appointments`,
    requestBody: diagnosticSession.dynamicsCalls
      .filter((call) => call.entity === "appointments")
      .at(-1)?.requestBody,
    derivedFromFrontend: {
      accountId,
      productIdSelfcare: request.productIdSelfcare,
      productGuid,
    },
  };
}
```

- [ ] **Step 4: Registrare lo step sintetico finale nel flow**

Nel punto in cui l'orchestrazione completa con successo, aggiungere:

```ts
diagnosticSession?.flowSummary.flowSteps.push({
  sequence: diagnosticSession.nextSequence,
  step: "createAppointment",
  status: "completed",
  summary: `Appointment creato con activityId ${appointment.activityid}`,
});
```

- [ ] **Step 5: Eseguire la build**

Run:

```bash
yarn workspace sm-crm-fn build
```

Expected: build TypeScript completata senza errori.

- [ ] **Step 6: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/appointments.ts apps/sm-crm-fn/_shared/services/orchestrator.ts
git commit -m "feat(sm-crm-fn): log full appointment payload to diagnostics"
```

### Task 5: Costruire la flow summary end-to-end e verificare il blob

**Files:**
- Modify: `apps/sm-crm-fn/_shared/services/orchestrator.ts`
- Modify: `apps/sm-crm-fn/_shared/services/diagnosticLogger.ts`
- Verify: `apps/sm-crm-fn/package.json`

- [ ] **Step 1: Inizializzare i flow steps all'avvio orchestratore**

In `createMeetingOrchestrator(...)`, dopo `createDiagnosticSession(...)`, aggiungere:

```ts
diagnosticSession?.flowSummary.flowSteps.push({
  sequence: 0,
  step: "frontendRequestReceived",
  status: "completed",
  summary: "Payload frontend ricevuto e sessione diagnostica inizializzata",
});
```

- [ ] **Step 2: Registrare i dati derivati account quando lo step 1 va a buon fine**

Subito dopo:

```ts
const accountId = accountResult.account.accountid;
const accountName = accountResult.account.name ?? "N/A";
```

aggiungere:

```ts
if (diagnosticSession) {
  diagnosticSession.flowSummary.derivedData.account = {
    accountId,
    accountName,
    resolutionMethod: accountResult.method,
  };

  diagnosticSession.flowSummary.flowSteps.push({
    sequence: diagnosticSession.nextSequence,
    step: "verifyAccount",
    status: "completed",
    summary: `Account risolto: ${accountId} (${accountResult.method})`,
  });
}
```

- [ ] **Step 3: Registrare fallimenti espliciti nei flow steps**

Nei punti di errore/fallimento per account, contatti e appointment, aggiungere pattern come:

```ts
diagnosticSession?.flowSummary.flowSteps.push({
  sequence: diagnosticSession.nextSequence,
  step: "verifyOrCreateContact",
  status: "failed",
  summary: `Errore contatti: ${msg}`,
});
```

- [ ] **Step 4: Allineare il result del flow summary con la risposta finale**

Quando costruisci `finalResponse` o `errorResponse`, aggiungere:

```ts
if (diagnosticSession) {
  diagnosticSession.flowSummary.result = {
    success: finalResponse.success,
    activityId: finalResponse.activityId,
    accountId: finalResponse.accountId,
    contactIds: finalResponse.contactIds,
    warnings: finalResponse.warnings,
    timestamp: finalResponse.timestamp,
  };
}
```

- [ ] **Step 5: Eseguire la build finale**

Run:

```bash
yarn workspace sm-crm-fn build
```

Expected: build TypeScript completata senza errori.

- [ ] **Step 6: Verifica manuale del blob diagnostico**

Avviare la function come gia' previsto dal progetto e inviare una richiesta `POST /meetings` di esempio:

```bash
yarn workspace sm-crm-fn start
```

In un secondo terminale, eseguire una chiamata di test coerente con il contratto API:

```bash
curl --location 'http://localhost:7071/api/meetings' \
  --header 'Content-Type: application/json' \
  --header 'x-dynamics-environment: UAT' \
  --data '{
    "institutionIdSelfcare": "demo-istituzione",
    "productIdSelfcare": "prod-pagopa",
    "partecipanti": [
      {
        "email": "mario.rossi@example.com",
        "nome": "Mario",
        "cognome": "Rossi"
      }
    ],
    "subject": "Verifica blob diagnostics",
    "scheduledstart": "2026-05-22T10:00:00Z",
    "scheduledend": "2026-05-22T11:00:00Z",
    "enableCreateContact": true
  }'
```

Expected:
- la function restituisce una risposta HTTP coerente con l'esito;
- nello storage compare un blob JSON per la sessione;
- il blob contiene `frontendPayload`, `flowSummary`, `dynamicsCalls`, `orchestratorResult`;
- in `dynamicsCalls` si vedono tutti i payload outbound verso Dynamics;
- `flowSummary.finalDynamicsRequest.requestBody` mostra il payload finale di `POST /appointments`.

- [ ] **Step 7: Commit**

```bash
git add apps/sm-crm-fn/_shared/services/orchestrator.ts apps/sm-crm-fn/_shared/services/diagnosticLogger.ts
git commit -m "feat(sm-crm-fn): add end-to-end diagnostics flow summary"
```
