# SMION-800 — Propagazione errori CRM al Frontend

- **Data:** 2026-07-09
- **Autore:** LoFrance
- **Branch:** SMION-800
- **Stato:** design approvato, in attesa di piano di implementazione
- **Ambito:** `apps/sm-crm-fn` (Azure Function) + `apps/sm-fe-smcr` (Next.js) — operazione `POST /meetings`

---

## 1. Contesto e problema

Oggi, quando la creazione di un meeting su Dynamics 365 fallisce, l'informazione sulla causa
**non arriva all'utente**:

- `httpClient.post` lancia `new Error("POST … failed: <status> - <errorBody>")` con il testo grezzo
  OData di Dynamics.
- `orchestrator` cattura l'errore dello step, lo salva in `steps[].error`, imposta `success:false`.
- `meetings/handler.ts` risponde **500** con un `message` **generico** ("Errore durante la creazione
  dell'appuntamento"); il dettaglio reale resta sepolto in `steps[].error`.
- Il frontend (`call-management.action.ts`) legge solo `data.message` / `data.error` top-level e mostra
  un toast generico. La causa reale (es. ente non trovato, contatto non valido, campo rifiutato dal CRM)
  **non è distinguibile** dall'utente.

**Obiettivo:** propagare al frontend una causa d'errore **strutturata e stabile**, così che l'utente veda
un messaggio comprensibile, senza accoppiare la Function alla lingua/UX del frontend e senza esporre lo
schema interno del CRM.

## 2. Decisioni di design (approvate)

| Tema | Decisione |
|------|-----------|
| Destinatario del messaggio | **Utente finale** (UI, toast) |
| Contratto Function → FE | **Codici neutri e stabili** (`code` + `category` + `step`), NON testo italiano |
| Traduzione in italiano | Responsabilità del **frontend** (disaccoppiamento) |
| Granularità codici | Codici specifici per caso noto + `category` + fallback `CRM_ERROR`/`UNKNOWN` |
| Raw detail Dynamics | **Solo server-side** (App Insights + `DiagnosticSession` sanitizzata); MAI nella risposta HTTP |
| Ambito | Solo `POST /meetings`, con pattern riusabile per estensioni future |
| Approccio implementativo | **A — classificazione centralizzata** in un `crmErrorMapper` + errore tipizzato `CrmError` |

## 3. Contratto d'errore (Function → FE)

Gli status HTTP restano invariati: **400** per errori di validazione, **500** per fallimento CRM.
Il corpo della risposta di errore assume questa forma:

```jsonc
{
  "success": false,
  "message": "Errore durante la creazione dell'appuntamento", // legacy, mantenuto per retro-compatibilità
  "error": {
    "code": "ACCOUNT_NOT_FOUND",   // stabile e neutro
    "category": "NOT_FOUND",        // VALIDATION | NOT_FOUND | CRM_REJECTED | CRM_UNAVAILABLE | UNKNOWN
    "step": "verifyAccount"         // step del flusso in cui è avvenuto l'errore
  },
  "timestamp": "2026-07-09T..."
}
```

### 3.1 Catalogo codici (v1)

| `code` | `category` | HTTP | Quando accade |
|--------|-----------|------|---------------|
| `VALIDATION_ERROR` | `VALIDATION` | 400 | Payload non valido (`validateOrchestratorRequest`) |
| `ACCOUNT_NOT_FOUND` | `NOT_FOUND` | 500 | Ente non risolto nello step `verifyAccount` |
| `CONTACT_INVALID` | `NOT_FOUND` | 500 | Contatto non trovato/creabile nello step `verifyOrCreateContacts` |
| `CRM_FIELD_REJECTED` | `CRM_REJECTED` | 500 | Dynamics rifiuta un campo/valore (es. OData `0x80040265` e simili) |
| `CRM_UNAVAILABLE` | `CRM_UNAVAILABLE` | 500 | Timeout / 5xx / irraggiungibilità di Dynamics |
| `CRM_ERROR` | `UNKNOWN` | 500 | Fallback per errore CRM non classificato |
| `UNKNOWN` | `UNKNOWN` | 500 | Fallback estremo (errore non riconducibile al CRM) |

> Il `rawDetail` (testo OData grezzo, codici `0x8004…`, eventuali nomi di campo/schema) **non** compare
> mai in `error`. È tracciato esclusivamente in App Insights e nella `DiagnosticSession` (sanitizzata),
> coerentemente con il fix di sicurezza di SMION-799.

## 4. Componenti (Approccio A)

### 4.1 Function (`apps/sm-crm-fn`)

1. **`_shared/errors/CrmError.ts`** (nuovo)
   Classe d'errore tipizzata con: `status` (HTTP Dynamics), `odataCode` (es. `0x80040265`),
   `rawDetail` (testo grezzo), `step?`. Sostituisce il `throw new Error("POST … failed: …")` grezzo.

2. **`_shared/services/crmErrorMapper.ts`** (nuovo — cuore dell'approccio)
   Funzione pura `mapCrmError(input): { code, category, step }`. Riceve `status` + `odataCode` + `step`
   e restituisce il codice neutro secondo il catalogo §3.1. **Nessun** testo italiano, **nessuna**
   dipendenza da HTTP. Unità testabile in isolamento.

3. **`_shared/services/httpClient.ts`** (modifica)
   Nel ramo `!response.ok`, lancia `new CrmError({ status, odataCode, rawDetail })` invece di `Error`
   con stringa. Il `rawDetail` continua a essere loggato server-side (App Insights).

4. **`_shared/services/orchestrator.ts`** (modifica minima)
   Dove già cattura gli errori di step, arricchisce il `CrmError` con lo `step`. Per i casi
   "non trovato" che oggi non lanciano (es. account/contatto assente), costruisce comunque
   l'informazione d'errore. Il risultato porta un campo `errorInfo?: { code, category, step }`.

5. **`meetings/handler.ts`** (modifica)
   Popola `error: { code, category, step }` nella risposta usando `mapCrmError`. Logga il `rawDetail`
   solo server-side. Mantiene `message` legacy.

6. **`__tests__/crmErrorMapper.test.ts`** (nuovo)
   Un test per ogni ramo del catalogo + fallback; verifica che `rawDetail` non compaia nell'output.

### 4.2 Frontend (`apps/sm-fe-smcr`)

7. **`lib/crm-error-messages.ts`** (nuovo)
   Dizionario `code → messaggio IT` + `getCrmErrorMessage(code?)` con fallback generico
   ("Errore CRM, contatta il supporto"). **Unico punto** con testi in italiano.

8. **`lib/actions/call-management.action.ts`** (modifica)
   Estrae `data.error?.code`; ritorna `{ success:false, error: getCrmErrorMessage(code) }`.
   Mantiene la firma attuale → nessun cambio a `crm-form.tsx` (che già fa `toast.error(crmResult.error)`).

### 4.3 Boundary

- `crmErrorMapper` non conosce HTTP né italiano.
- `handler` non conosce le stringhe OData grezze.
- Il frontend non conosce Dynamics: consuma solo `code`.

## 5. Flusso dati

```
Dynamics 4xx/5xx  ─►  httpClient.post lancia CrmError{status,odataCode,rawDetail}
                       (rawDetail → App Insights, NON in risposta)
        │
        ▼
orchestrator: catch step → arricchisce CrmError con step="verifyAccount"
              (per i casi "not found" senza throw, costruisce comunque il code)
        │
        ▼
handler: mapCrmError(...) → { code:"ACCOUNT_NOT_FOUND", category:"NOT_FOUND", step }
         risposta 500 (o 400 per VALIDATION) con error:{...}, raw solo nei log
        │
        ▼
FE call-management.action: estrae data.error.code (fallback su message legacy)
        │
        ▼
crm-form.tsx: toast.error( getCrmErrorMessage(code) )   ← unico punto con testi IT
```

## 6. Casi limite

- **`error` assente** (successo, o vecchia risposta): il FE usa il `message` legacy → nessuna regressione.
- **`code` sconosciuto** al FE: fallback "Errore CRM, contatta il supporto".
- **Fallback `0x80040265`** già presente in `appointments.ts`: resta invariato; se dopo il fallback
  l'esito è success, **nessun** errore propagato (comportamento attuale preservato).
- **207 Multi-Status** (warnings, meeting creato): resta `success:true` → nessun `error`;
  i warnings non diventano errori.

## 7. Testing

**Function (Jest):**
- `crmErrorMapper.test.ts`: un test per ramo (`VALIDATION_ERROR`, `ACCOUNT_NOT_FOUND`, `CONTACT_INVALID`,
  `CRM_FIELD_REJECTED`, `CRM_UNAVAILABLE`, fallback `CRM_ERROR`/`UNKNOWN`); assert che `rawDetail` non
  sia nell'output.
- `CrmError`: costruttore/proprietà.
- Handler: la risposta d'errore contiene `error.{code,category,step}` e **non** il raw detail
  (guard anti-regressione del finding SMION-799).

**Frontend:**
- Test del dizionario: code noto → testo corretto; code sconosciuto → fallback.

## 8. Documentazione

- **`apps/sm-crm-fn/docs/FE_ERROR_CODES_GUIDE.md`** (nuovo): guida per chi implementa il frontend —
  tabella `code | category | HTTP status | quando accade | messaggio IT suggerito`, esempi JSON di
  risposta, indicazioni su fallback e retro-compatibilità.
- Aggiornare `apps/sm-crm-fn/docs/API_GUIDE.md` e/o `openapi.yaml` dove documentano lo schema di risposta
  di `POST /meetings`, aggiungendo l'oggetto `error`.

## 9. Fuori ambito (YAGNI)

- Propagazione errori per accounts/contacts/lista meeting (rimandata; il pattern resta riusabile).
- Internazionalizzazione multi-lingua nel frontend (solo italiano per ora).
- Retry automatici lato frontend (`retriable` non incluso nel contratto v1).
