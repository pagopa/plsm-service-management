# 📝 Changelog - Miglioramento Logging CRM Function

**Data**: 21 Febbraio 2026  
**Autore**: Lorenzo Franceschini  
**Branch**: smion-668/add-endpoint

---

## [2026-02-21] - STEP 2 Error Handling Enhancement

### Changed

- Added comprehensive try-catch wrapper to STEP 2 (contact verification/creation loop) in `orchestrator.ts`
- Added console.log markers for Azure Log Stream visibility:
  - `[STEP 2 START]` - Before contact processing loop begins
  - `[CONTACT VERIFY START]` - For each contact being processed
  - `[CONTACT VERIFY RESULT]` - After each verifyOrCreateContact call (shows CREATED/FOUND/FAILED)
  - `[STEP 2 CONTACTS PROCESSED]` - After loop completes with summary
  - `[STEP 2 EXCEPTION]` - In catch block for unhandled exceptions

### Fixed

- STEP 2 exceptions are now properly caught and logged with full error details
- Contact processing failures now include timer duration and context in error logs
- Follows same error handling pattern as STEP 1 for consistency

### Why

- Production logs showed STEP 1 completing successfully but STEP 2 failing silently
- Missing try-catch in STEP 2 meant exceptions from verifyOrCreateContact were not being logged
- Console.log markers provide visibility in Azure Log Stream when structured logs are truncated

---

## 🐛 **Bug Fixes**

### Bug #1: GET `/api/v1/contacts?accountId=XXX` ritornava array vuoto

**File**: `_shared/services/contacts.ts` (riga 94)

**Problema**: Il filtro OData per recuperare i contatti di un Account era errato:

```typescript
// ❌ PRIMA (ERRATO)
filter: `_parentcustomerid_value eq ${accountId}`,
```

**Causa**: Dynamics 365 richiede che i GUID siano racchiusi tra apici singoli nelle query OData.

**Soluzione applicata**:

```typescript
// ✅ DOPO (CORRETTO)
filter: `_parentcustomerid_value eq '${accountId}'`,
```

---

### Bug #2: Creazione appuntamento falliva con "abilitazione alla creazione disattivata"

**File**: `_shared/services/orchestrator.ts` (righe 76 e 139)

**Problema**: Due parametri booleani venivano **sempre impostati a `false`** a causa di un errore di assegnazione invece di lettura:

```typescript
// ❌ PRIMA (ERRATO) - riga 76
enableFallback: (request.enableFallback = false),

// ❌ PRIMA (ERRATO) - riga 139
enableCreateContact: (request.enableCreateContact = false),
```

**Causa**: L'operatore `=` **assegna** il valore invece di leggerlo, quindi entrambi i parametri venivano **forzati a `false`** ignorando i valori della richiesta.

**Soluzione applicata**:

```typescript
// ✅ DOPO (CORRETTO) - riga 76
enableFallback: request.enableFallback ?? false,

// ✅ DOPO (CORRETTO) - riga 139
enableCreateContact: request.enableCreateContact ?? false,
```

---

## 🎯 **Logging Improvements**

### 1. Nuovo Sistema di Logging Strutturato

Creato il file `_shared/utils/logger.ts` con un sistema di logging professionale per Azure Functions.

#### Features:

- ✅ **Livelli di log**: `DEBUG`, `INFO`, `WARN`, `ERROR`
- ✅ **Metadata strutturati**: Tutti i log includono metadata JSON per facile parsing in Application Insights
- ✅ **Emoji per visual scanning**: Ogni livello ha un emoji distintivo (🔍 DEBUG, ℹ️ INFO, ⚠️ WARN, ❌ ERROR)
- ✅ **Sanitizzazione URL**: Rimozione automatica di token e dati sensibili dagli URL
- ✅ **Timer**: Misurazione automatica della durata delle operazioni
- ✅ **Context-aware**: Integrazione con `InvocationContext` di Azure Functions
- ✅ **Child loggers**: Possibilità di creare logger con metadata condivisi

#### Esempio di uso:

```typescript
import { createLogger, Timer } from "../utils/logger";

const logger = createLogger(context, { accountId: "123" });
const timer = new Timer();

logger.info("Starting operation", { operationType: "search" });
// ... operation ...
logger.info("Operation completed", { duration: timer.elapsed() });
```

---

### 2. HTTP Client con Logging Avanzato

**File**: `_shared/services/httpClient.ts`

#### Miglioramenti:

- ✅ Log di ogni richiesta HTTP con metodo, URL sanitizzato
- ✅ Log di ogni risposta con status code, durata, numero risultati
- ✅ Log dettagliato degli errori con stack trace
- ✅ Debug del body delle POST (solo in modalità DEBUG)
- ✅ Tracking della durata di ogni chiamata in millisecondi

#### Esempio di log output:

```
ℹ️ [INFO] HTTP GET → dev-pagopa.crm4.dynamics.com/api/data/v9.2/contacts | {"method":"GET","url":"..."}
ℹ️ [INFO] HTTP GET ← 200 (345ms) - 3 results | {"statusCode":200,"duration":345,"resultCount":3}
```

---

### 3. Contacts Service con Logging Dettagliato

**File**: `_shared/services/contacts.ts`

#### Funzioni aggiornate:

- ✅ `getContactsByAccountId()`: Log di query OData, risultati trovati, durata
- ✅ `getContactByEmailAndInstitution()`: Log di ricerca primaria con tutti i parametri
- ✅ `getContactByEmailAndProduct()`: Log di fallback search con prodotto GUID
- ✅ `verifyOrCreateContact()`: Log step-by-step del flusso (search → fallback → create)

#### Esempio di log output per ricerca contatto:

```
ℹ️ [INFO] 🔍 Searching contact by email, institution and product | {"email":"w.chiari@test.it","institutionId":"...","productId":"prod-pagopa"}
🔍 [DEBUG] OData Query: /api/data/v9.2/contacts | {"odataFilter":"pgp_identificativoselfcarecliente eq '...'"}
ℹ️ [INFO] HTTP GET → dev-pagopa.crm4.dynamics.com/api/data/v9.2/contacts
ℹ️ [INFO] HTTP GET ← 200 (234ms) - 1 results
ℹ️ [INFO] ✅ Contact found by email and institution | {"contactId":"f7587a49...","fullName":"Walter Chiari","duration":234}
```

---

### 4. Orchestrator con Logging Step-by-Step

**File**: `_shared/services/orchestrator.ts`

#### Miglioramenti:

- ✅ Log dell'avvio orchestrator con tutti i parametri
- ✅ Log dettagliato per ogni step (1/4, 2/4, 3/4, 4/4)
- ✅ Timer per ogni step e durata totale
- ✅ Log di successo/fallimento per ogni step
- ✅ Log dei contatti processati uno per uno
- ✅ Log finale con riepilogo completo

#### Esempio di log output per creazione appuntamento:

```
ℹ️ [INFO] 🚀 Starting meeting orchestrator | {"institutionId":"...","partecipantiCount":1,"enableCreateContact":true,"dryRun":false}
ℹ️ [INFO] 📋 STEP 1/4: Account verification | {"institutionId":"..."}
ℹ️ [INFO] ✅ STEP 1 COMPLETED: Account found | {"accountId":"...","accountName":"E.G.L. S.R.L.S.","duration":156}
ℹ️ [INFO] 📋 STEP 2/4: Contact verification/creation | {"partecipantiCount":1,"enableCreateContact":true}
ℹ️ [INFO] Processing contact 1/1 | {"email":"w.chiari@test.it","hasNome":true,"hasCognome":true}
ℹ️ [INFO] 🔄 Starting contact verification/creation flow | {"email":"w.chiari@test.it","enableCreateContact":true}
ℹ️ [INFO] ✅ Contact found by institution ID | {"contactId":"...","duration":123}
ℹ️ [INFO] ✅ STEP 2 COMPLETED: Contacts processed | {"contactsProcessed":1,"duration":345}
ℹ️ [INFO] 📋 STEP 3/4: Appointment creation | {"subject":"Riunione","scheduledstart":"...","contactsCount":1}
ℹ️ [INFO] ✅ STEP 3 COMPLETED: Appointment created | {"activityId":"...","duration":234}
ℹ️ [INFO] 📋 STEP 4/4: Grant access to Sales team | {"activityId":"..."}
ℹ️ [INFO] ✅ STEP 4 COMPLETED: Access granted to Sales team | {"teamId":"...","duration":89}
ℹ️ [INFO] ✅ ORCHESTRATOR COMPLETED SUCCESSFULLY | {"totalDuration":947,"contactsProcessed":1,"warningsCount":0}
```

---

### 5. Contacts Handler con Logging

**File**: `contacts/handler.ts`

#### Miglioramenti:

- ✅ Log della richiesta HTTP ricevuta
- ✅ Log dei parametri di query ricevuti
- ✅ Log di validazione input
- ✅ Log di risultati (trovato/non trovato, conteggio)
- ✅ Log di errori con dettagli completi

---

## 🎨 **Vantaggi del Nuovo Sistema di Logging**

### Per il debugging:

1. **Tracciabilità completa**: Ogni operazione ha un ID correlabile attraverso i metadata
2. **Durata operazioni**: Timer automatici per identificare bottleneck
3. **Errori dettagliati**: Stack trace completi e context dell'errore
4. **Query OData visibili**: Tutti i filtri e parametri sono loggati

### Per il monitoraggio in produzione:

1. **Application Insights ready**: Formato JSON parsabile automaticamente
2. **Livelli di log**: Possibilità di filtrare per severità
3. **Visual scanning**: Emoji rendono facile identificare problemi nei log stream
4. **Metadata strutturati**: Facile creare dashboard e alert su campi specifici

### Per l'analisi:

1. **Conteggio automatico**: Ogni query logga il numero di risultati
2. **Performance tracking**: Durata di ogni operazione in millisecondi
3. **Success/failure rate**: Facile aggregare statistiche di successo
4. **Audit trail**: Traccia completa di chi ha fatto cosa e quando

---

## 🔧 **Configurazione**

### Abilita Debug Logging

Per abilitare i log di debug in sviluppo:

```bash
export DEBUG=true
```

In Azure Function App, aggiungi:

```
DEBUG=true
```

nelle Application Settings per ambiente di staging/dev.

**⚠️ ATTENZIONE**: Non abilitare DEBUG in produzione per evitare log eccessivi.

---

## 📊 **Log Levels Guide**

| Livello | Emoji | Quando usarlo                          | Visibile in prod        |
| ------- | ----- | -------------------------------------- | ----------------------- |
| DEBUG   | 🔍    | Dettagli implementativi, query OData   | No (solo se DEBUG=true) |
| INFO    | ℹ️    | Operazioni normali, successi, progress | Sì                      |
| WARN    | ⚠️    | Situazioni anomale ma gestite          | Sì                      |
| ERROR   | ❌    | Errori bloccanti, fallimenti           | Sì                      |

---

## 📈 **Query Application Insights**

### Trovare operazioni lente:

```kusto
traces
| where message contains "duration"
| extend metadata = parse_json(tostring(customDimensions.metadata))
| where metadata.duration > 1000
| project timestamp, message, duration=metadata.duration, operation=metadata.operation
| order by duration desc
```

### Contare errori per tipo:

```kusto
traces
| where severityLevel >= 3  // ERROR level
| extend metadata = parse_json(tostring(customDimensions.metadata))
| summarize count() by tostring(metadata.error)
| order by count_ desc
```

### Analizzare successo creazione contatti:

```kusto
traces
| where message contains "Contact"
| extend metadata = parse_json(tostring(customDimensions.metadata))
| where isnotnull(metadata.created)
| summarize created=countif(metadata.created == true), found=countif(metadata.created == false)
```

---

## ✅ **Testing**

### Test del fix GET contatti:

```bash
curl -X GET "https://<function-url>/api/v1/contacts?accountId=29ae898f-69c8-f011-bbd2-7ced8d472a9b" \
  -H "Content-Type: application/json"
```

**Log attesi nei Azure Function Logs**:

```
ℹ️ [INFO] HTTP GET /contacts request received
ℹ️ [INFO] Searching contacts by Account ID | {"accountId":"29ae898f..."}
🔍 [DEBUG] OData Query: /api/data/v9.2/contacts | {"odataFilter":"_parentcustomerid_value eq '29ae898f...'"}
ℹ️ [INFO] ✅ Found 3 contact(s) for Account ID | {"resultCount":3,"duration":234}
ℹ️ [INFO] Contacts search completed | {"accountId":"29ae898f...","count":3}
```

### Test creazione appuntamento con enableCreateContact:

```bash
curl -X POST "https://<function-url>/api/v1/meetings" \
  -H "Content-Type: application/json" \
  -d '{
    "institutionIdSelfcare": "fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76",
    "productIdSelfcare": "prod-pagopa",
    "enableCreateContact": true,
    "partecipanti": [
      {
        "email": "nuovo.contatto@test.it",
        "nome": "Nuovo",
        "cognome": "Contatto"
      }
    ],
    "subject": "Test Meeting",
    "scheduledstart": "2026-03-01T10:00:00Z",
    "scheduledend": "2026-03-01T11:00:00Z"
  }'
```

**Log attesi**:

```
ℹ️ [INFO] 🚀 Starting meeting orchestrator | {"enableCreateContact":true}
ℹ️ [INFO] 📋 STEP 1/4: Account verification
ℹ️ [INFO] ✅ STEP 1 COMPLETED: Account found
ℹ️ [INFO] 📋 STEP 2/4: Contact verification/creation
ℹ️ [INFO] Creating new contact in Dynamics | {"nome":"Nuovo","cognome":"Contatto"}
ℹ️ [INFO] ✅ Contact created successfully | {"contactId":"...","duration":456}
ℹ️ [INFO] ✅ STEP 2 COMPLETED: Contacts processed
ℹ️ [INFO] 📋 STEP 3/4: Appointment creation
ℹ️ [INFO] ✅ STEP 3 COMPLETED: Appointment created
ℹ️ [INFO] 📋 STEP 4/4: Grant access to Sales team
ℹ️ [INFO] ✅ ORCHESTRATOR COMPLETED SUCCESSFULLY
```

---

## 🚀 **Deploy**

Il codice è compilato e pronto per il deploy. Per vedere i nuovi log in Azure:

1. **Azure Portal** → Function App → Log stream
2. **Application Insights** → Transaction search
3. **Azure CLI**:
   ```bash
   az webapp log tail --name <function-app-name> --resource-group <rg-name>
   ```

---

## 📝 **File Modificati**

| File                               | Modifiche                        | Tipo                  |
| ---------------------------------- | -------------------------------- | --------------------- |
| `_shared/utils/logger.ts`          | ➕ Creato                        | New Feature           |
| `_shared/services/httpClient.ts`   | 🔄 Aggiunto logging HTTP         | Enhancement           |
| `_shared/services/contacts.ts`     | 🐛 Fix filtro OData + 🔄 Logging | Bug Fix + Enhancement |
| `_shared/services/orchestrator.ts` | 🐛 Fix parametri + 🔄 Logging    | Bug Fix + Enhancement |
| `contacts/handler.ts`              | 🔄 Aggiunto logging              | Enhancement           |

---

## 📚 **Documentazione Aggiuntiva**

### Riferimenti Dynamics 365:

- Documento spec: `/Users/lorenzo.franceschini/Downloads/CRM_SMCR - Interfaccia Appuntamenti SM v1.docx`
- OData API: `https://dev-pagopa.crm4.dynamics.com/api/data/v9.2/`

### Best Practices:

1. Usare sempre `logger.info()` per operazioni normali
2. Usare `logger.warn()` per situazioni anomale ma non bloccanti
3. Usare `logger.error()` solo per errori che impediscono il completamento
4. Includere sempre metadata rilevanti (IDs, email, count, duration)
5. Mai loggare dati sensibili (password, token completi, PII non necessari)

---

**Fine del documento** ✅
