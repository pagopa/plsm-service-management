# Guida Rapida - Testing Endpoints con Postman

Questa guida spiega come testare gli endpoint dell'integrazione Dynamics CRM con Postman.

## Prerequisiti

1. Postman installato
2. Function Key dell'Azure Function (disponibile nel portale Azure)
3. URL dell'ambiente (locale o Azure)

## Configurazione Postman

### 1. Importa OpenAPI Spec

- Apri Postman
- Click su "Import" → seleziona `openapi.yaml`
- Postman creerà automaticamente tutte le richieste

### 2. Crea Environment

Crea un nuovo environment con le seguenti variabili:

**Ambiente Locale:**

```
BASE_URL = http://localhost:7071/api/v1
FUNCTION_KEY = (lascia vuoto per locale)
```

**Ambiente DEV/UAT/PROD:**

```
BASE_URL = https://sm-{env}-itn-pg-<service>-fn.azurewebsites.net/api/v1
FUNCTION_KEY = <la-tua-function-key>
```

_Nota: Sostituire `{env}` con `d`, `u` o `p` e `<service>` con il nome del servizio._
BASE_URL = https://sm-{env}-itn-pg-smcr-fn.azurewebsites.net/api/v1
FUNCTION_KEY = <la-tua-function-key>

```

## Endpoints Disponibili

### 🔍 1. Ottieni Ente per Selfcare ID

**Endpoint:** `GET {{BASE_URL}}/accounts?selfcareId={id}`

**Esempio:**

```

GET {{BASE_URL}}/accounts?selfcareId=fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76

Headers:
x-functions-key: {{FUNCTION_KEY}}

````

**Risposta Successo (200):**

```json
{
  "success": true,
  "data": {
    "accountid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "name": "Comune di Roma",
    "pgp_identificativoselfcare": "fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76",
    "emailaddress1": "info@comune.roma.it",
    "statecode": 0
  },
  "timestamp": "2025-02-11T10:30:00Z"
}
````

**Possibili Errori:**

- `400` - Parametro mancante
- `404` - Ente non trovato
- `409` - Più enti trovati (ambiguità)

---

### 🔍 2. Ottieni Ente per Nome (Fallback)

**Endpoint:** `GET {{BASE_URL}}/accounts?name={nome}`

**Esempio:**

```
GET {{BASE_URL}}/accounts?name=Comune di Roma

Headers:
  x-functions-key: {{FUNCTION_KEY}}
```

---

### 👥 3. Ottieni Tutti i Contatti di un Ente

**Endpoint:** `GET {{BASE_URL}}/contacts?accountId={accountId}`

**Esempio:**

```
GET {{BASE_URL}}/contacts?accountId=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

Headers:
  x-functions-key: {{FUNCTION_KEY}}
```

**Risposta Successo (200):**

```json
{
  "success": true,
  "data": [
    {
      "contactid": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
      "fullname": "Mario Rossi",
      "firstname": "Mario",
      "lastname": "Rossi",
      "emailaddress1": "mario.rossi@ente.it",
      "_parentcustomerid_value": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "pgp_tipologiareferente": 100000002
    }
  ],
  "count": 1,
  "timestamp": "2025-02-11T10:30:00Z"
}
```

---

### 👤 4. Ottieni Singolo Contatto

**Endpoint:** `GET {{BASE_URL}}/contacts?contactId={contactId}`

**Esempio:**

```
GET {{BASE_URL}}/contacts?contactId=yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy

Headers:
  x-functions-key: {{FUNCTION_KEY}}
```

**Risposta Successo (200):**

```json
{
  "success": true,
  "data": {
    "contactid": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "fullname": "Mario Rossi",
    "emailaddress1": "mario.rossi@ente.it"
  },
  "timestamp": "2025-02-11T10:30:00Z"
}
```

---

### 📅 5. Crea Appuntamento

**Endpoint:** `POST {{BASE_URL}}/meetings`

**Esempio:**

```
POST {{BASE_URL}}/meetings

Headers:
  x-functions-key: {{FUNCTION_KEY}}
  Content-Type: application/json

Body:
{
  "institutionIdSelfcare": "fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76",
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
  "dryRun": false
}
```

---

## 🧪 Test Completo - Workflow

Esegui questi passaggi in sequenza per testare il flusso completo:

### Step 1: Verifica Connettività

```
GET {{BASE_URL}}/dynamics/ping
```

Deve ritornare `200` con `"status": "connected"`.

### Step 2: Cerca l'Ente

```
GET {{BASE_URL}}/accounts?selfcareId=fce7a03b-94fe-4fa6-8dc3-10c1b4f45a76
```

Salva l'`accountid` dalla risposta.

### Step 3: Ottieni Contatti dell'Ente

```
GET {{BASE_URL}}/contacts?accountId={accountid-ottenuto-step2}
```

Verifica i contatti esistenti.

### Step 4: Crea Appuntamento (Dry-Run)

```
POST {{BASE_URL}}/meetings
Body: { ..., "dryRun": true }
```

Testa senza modificare Dynamics.

### Step 5: Crea Appuntamento (Reale)

```
POST {{BASE_URL}}/meetings
Body: { ..., "dryRun": false }
```

Crea effettivamente l'appuntamento.

---

## 💡 Tips Postman Avanzati

### 1. Estrai automaticamente accountId

Aggiungi questo script nella tab "Tests" della richiesta GET accounts:

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  pm.environment.set("accountId", response.data.accountid);
  console.log("Account ID salvato:", response.data.accountid);
}
```

### 2. Estrai contactId

Nella richiesta GET contacts (lista):

```javascript
if (pm.response.code === 200) {
  const response = pm.response.json();
  if (response.data && response.data.length > 0) {
    pm.environment.set("contactId", response.data[0].contactid);
    console.log("Contact ID salvato:", response.data[0].contactid);
  }
}
```

### 3. Genera timestamp dinamici

Nella tab "Pre-request Script" della richiesta POST meetings:

```javascript
// Genera scheduledstart tra 1 ora
const start = new Date();
start.setHours(start.getHours() + 1);
pm.environment.set("scheduledstart", start.toISOString());

// Genera scheduledend tra 2 ore
const end = new Date();
end.setHours(end.getHours() + 2);
pm.environment.set("scheduledend", end.toISOString());
```

Poi nel body usa:

```json
{
  "scheduledstart": "{{scheduledstart}}",
  "scheduledend": "{{scheduledend}}"
}
```

---

## 🚨 Troubleshooting

### Errore 401 Unauthorized

- Verifica che la Function Key sia corretta
- Controlla che l'header `x-functions-key` sia impostato

### Errore 404 Not Found

- Verifica che l'URL sia corretto
- Controlla che il servizio sia attivo (`GET /health`)

### Errore 409 Conflict (Ambiguità)

- Troppi enti trovati con lo stesso criterio
- Usa `selfcareId` invece di `name` per ricerche precise

### Errore 500 Internal Server Error

- Controlla i log della Function App nel portale Azure
- Verifica la connettività con Dynamics CRM (`GET /dynamics/ping`)

---

## 📚 Riferimenti

- OpenAPI Spec: `openapi.yaml`
- README completo: `README.md`
- Documentazione PagoPA: [Link documentazione interna]
