# SM-CRM-FN - Integrazione Dynamics 365 CRM

Azure Functions per l'integrazione con Microsoft Dynamics 365 CRM. Leggere la documentazione riportata a fondo pagina.

## Scopo

Questa integrazione permette di:

- ✅ Verificare l'esistenza di Enti (Accounts) e Contatti
- ✅ Creare Contatti se mancanti
- ✅ Creare Appuntamenti CRM con partecipanti
- ✅ Rendere gli appuntamenti visibili al team Sales (GrantAccess)

## Architettura

```
sm-crm-fn/
├── _shared/
│   ├── services/
│   │   ├── accounts.ts       # Verifica enti (Endpoint 1-2)
│   │   ├── appointments.ts   # Gestione appuntamenti (Endpoint 6)
│   │   ├── auth.ts           # Autenticazione Azure AD
│   │   ├── contacts.ts       # Verifica/crea contatti (Endpoint 3-5)
│   │   ├── grantAccess.ts    # Visibilità team Sales (Endpoint 7)
│   │   ├── httpClient.ts     # Client HTTP con dry-run
│   │   └── orchestrator.ts   # Orchestratore flusso completo
│   ├── types/
│   │   └── dynamics.ts       # Definizioni TypeScript
│   └── utils/
│       ├── config.ts         # Configurazione ambiente
│       └── mappings.ts       # Mapping prodotti e referenti
├── health/                   # Health check endpoint
├── meetings/                 # Endpoint appuntamenti
└── ping/                     # Test connettività Dynamics
```

## Sistemi Coinvolti

| Sistema                            | Descrizione             |
| ---------------------------------- | ----------------------- |
| Frontend Selfcare / CRM Client     | Origine delle richieste |
| Backend Integration Layer          | Questa Azure Function   |
| Microsoft Dynamics 365 (Dataverse) | CRM di destinazione     |

## URL Ambienti

| Ambiente | URL                                    |
| -------- | -------------------------------------- |
| DEV      | `https://********.***.****.com` |
| UAT      | `https://********.***.****.com` |
| PROD     | `https://*********.****.****.com`     |

## Autenticazione

### Produzione (Managed Identity)

In produzione l'autenticazione avviene tramite **Managed Identity**:

1. La Function App deve avere `System Assigned Identity = On`
2. Creare un Application User in Dynamics tramite Power Platform
3. Assegnare i ruoli necessari all'utente:
   - PagoPA - Coordinazione e sviluppo Commerciale
   - PagoPA - Coordinazione e sviluppo Partnership
   - PagoPA - Direzione e Coordinamento

### Sviluppo Locale

Per lo sviluppo locale, configurare le variabili in `local.settings.json`:

```json
{
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "DYNAMICS_BASE_URL": "https://********.***.****.com",
    "AZURE_TENANT_ID": "<tenant-id>",
    "AZURE_CLIENT_ID": "<client-id>",
    "NODE_ENV": "development"
  }
}
```

## API Documentation

La specifica OpenAPI è disponibile in [openapi.yaml](./openapi.yaml).

Per visualizzarla:

- [Swagger Editor](https://editor.swagger.io/) - incolla il contenuto
- VS Code con estensione "OpenAPI (Swagger) Editor"

## API Endpoints

### Health Check

```http
GET /api/v1/health
```

### Ping Dynamics

Verifica la connettività con Dynamics CRM.

```http
GET /api/v1/dynamics/ping
```

### Lista Appuntamenti

```http
GET /api/v1/meetings?top=50&filter=statecode eq 0
```

### Crea Appuntamento

```http
POST /api/v1/meetings
Content-Type: application/json

{
  "institutionIdSelfcare": "uuid-ente-selfcare",
  "productIdSelfcare": "prod-pagopa",
  "partecipanti": [
    {
      "email": "mario.rossi@ente.it",
      "nome": "Mario",
      "cognome": "Rossi",
      "tipologiaReferente": "TECNICO"
    }
  ],
  "subject": "Riunione di allineamento",
  "scheduledstart": "2025-02-15T10:00:00Z",
  "scheduledend": "2025-02-15T11:00:00Z",
  "location": "Google Meet",
  "description": "Discussione requisiti",
  "nextstep": "Preparare documentazione",
  "dryRun": false
}
```

### Dry-Run (Test senza modifiche)

```http
POST /api/v1/meetings/dry-run
Content-Type: application/json

{
  // stesso body di POST /meetings
}
```

## Flusso di Creazione Appuntamento

```
┌─────────────────────────────────────────────────────────────────┐
│                         REQUEST                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Verifica Ente                                           │
│ ─────────────────────                                           │
│ • GET /accounts?$filter=pgp_identificativoselfcare eq '...'     │
│ • Per ora ignora la fallback:                                   │
│   • Fallback: GET /accounts?$filter=contains(name, '...')       │
│ • Se non trovato → ERRORE                                       │
│ • Se ambiguo (>1) → ERRORE                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Verifica/Crea Contatti (per ogni partecipante)          │
│ ──────────────────────────────────────────────────────          │
│ • GET /contacts?$filter=email + ente + prodotto                 │
│ • Fallback: GET /contacts?$filter=email + productGUID           │
│ • Se non trovato → POST /contacts (crea nuovo)                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: Crea Appuntamento                                       │
│ ─────────────────────────                                       │
│ • POST /appointments con appointment_activity_parties           │
│ • Collega account e contatti come partecipanti                  │
│ • statuscode: 5 (Busy)                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: GrantAccess                                             │
│ ───────────────────                                             │
│ • POST /appointments({id})/Microsoft.Dynamics.CRM.GrantAccess   │
│ • Condivide con team Sales (ReadAccess)                         │
│ • Se fallisce → WARNING (appuntamento creato ma non visibile)   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Mapping Dati

### Prodotti Selfcare → GUID CRM

| productIdSelfcare     | Prodotto         | GUID UAT                               | GUID PROD                              |
| --------------------- | ---------------- | -------------------------------------- | -------------------------------------- |
| `prod-pn`             | SEND             | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-io`             | IO               | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-pagopa`         | pagoPA           | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-idpay`          | IDPAY            | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-idpay-merchant` | IDPAY Esercenti  | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-checkiban`      | CheckIBAN        | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx |
| `prod-interop`        | Interoperabilità | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-io-premium`     | IO Premium       | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-io-sign`        | Firma con IO     | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` |
| `prod-rtp`            | Request To Pay   | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | -                                      |

### Tipologia Referente

| Valore                                    | ID CRM    |
| ----------------------------------------- | --------- |
| `APICALE`                                 | 100000000 |
| `DIRETTO`                                 | 100000001 |
| `TECNICO`                                 | 100000002 |
| `BUSINESS`                                | 100000003 |
| `ACCOUNT`                                 | 100000004 |
| `RESPONSABILE_DI_TRASFORMAZIONE_DIGITALE` | 100000005 |
| `REFERENTE_CONTRATTUALE`                  | 100000006 |
| `RESPONSABILE_PROTEZIONE_DATI`            | 100000007 |
| `REFERENTE_BUSINESS_APICALE_ACCOUNT`      | 100000008 |

### Team per GrantAccess

| Ambiente | Team ID                                | Nome       |
| -------- | -------------------------------------- | ---------- |
| UAT      | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | uat-pagopa |
| PROD     | `xxxxxxxx-xxxxx-xxxx-xxxxx-xxxxxxxxxx` | pagopa     |

## Gestione Errori

| Caso                                      | Azione                                        | HTTP Status |
| ----------------------------------------- | --------------------------------------------- | ----------- |
| Ente non trovato                          | Errore bloccante                              | 404         |
| Più enti trovati                          | Errore funzionale                             | 409         |
| Contatto non trovato e dati insufficienti | Warning, continua                             | -           |
| Creazione appuntamento fallita            | Errore bloccante                              | 500         |
| GrantAccess fallisce                      | Warning (appuntamento creato ma non visibile) | 207         |

## Dry-Run Mode

Il **dry-run mode** permette di testare il flusso completo senza effettuare modifiche su Dynamics CRM:

```bash
# Endpoint dedicato (sempre dry-run)
curl -X POST http://localhost:7071/api/v1/meetings/dry-run \
  -H "Content-Type: application/json" \
  -d '{
    "institutionIdSelfcare": "fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76",
    "productIdSelfcare": "prod-pagopa",
    "partecipanti": [
      {
        "email": "test@example.com",
        "nome": "Test",
        "cognome": "User",
        "tipologiaReferente": "TECNICO"
      }
    ],
    "subject": "Test meeting dry-run",
    "scheduledstart": "2025-02-15T10:00:00Z",
    "scheduledend": "2025-02-15T11:00:00Z",
    "enableFallback": "false",
    "enableCreateContact": "false"
  }'

# Oppure con flag nel body
curl -X POST http://localhost:7071/api/v1/meetings \
  -H "Content-Type: application/json" \
  -d '{ "dryRun": true, ... }'
```

In dry-run mode:

- Le chiamate GET ritornano dati mock realistici
- Le chiamate POST loggano il body e ritornano UUID generati
- Nessuna modifica viene effettuata su Dynamics

## Sviluppo

### Prerequisiti

- Node.js 20+
- Azure Functions Core Tools v4
- Yarn

### Setup

```bash
# Installa dipendenze
yarn install

# Build
yarn build

# Avvia in locale
func start
```

Attenzione in locale dovresti avere una utenza abilitata al CRM altrimenti l'auth restituisce un bel *403*

## Headers HTTP Richiesti

Tutte le chiamate a Dynamics utilizzano i seguenti headers (gestiti automaticamente da `httpClient.ts`):

```typescript
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json; charset=utf-8",
  "OData-MaxVersion": "4.0",
  "OData-Version": "4.0",
  "Accept": "application/json",
  "Prefer": "return=representation"
}
```

## Riferimenti

- [Dynamics 365 Web API](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/overview)
- [Azure Managed Identity](https://eugenevanstaden.com/blog/d365-managed-identity/)
- [Documentazione interna PagoPA - Interfaccia Appuntamenti SM v1](https://docs.google.com/document/d/1DCyWqbKl166xKQUvmtgpOx8NPJk_QGf3/edit#heading=h.k7snzpo6plas)
- [Documentazione interna PagoPA - Integrazione]https://docs.google.com/document/d/1Ey3Voyj6Wi1Tl8t41QUuZMEkOgc7zK6EP7HFe7K9-sM/edit?tab=t.0)
