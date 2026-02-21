# enableGrantAccess Feature - Example Request Payloads

## 1. Request WITHOUT GrantAccess (Default Behavior)

When `enableGrantAccess` is omitted or set to `false`, the GrantAccess step (STEP 4) is skipped entirely.

```json
{
  "institutionIdSelfcare": "d61bfa3b-1234-5678-90ab-cdef12345678",
  "productIdSelfcare": "prod-pn",
  "partecipanti": [
    {
      "email": "mario.rossi@ente.it",
      "nome": "Mario",
      "cognome": "Rossi",
      "tipologiaReferente": "TECNICO"
    },
    {
      "email": "laura.bianchi@ente.it",
      "nome": "Laura",
      "cognome": "Bianchi",
      "tipologiaReferente": "BUSINESS"
    }
  ],
  "subject": "Riunione Q1 2025 - Onboarding SEND",
  "description": "Discussione sui requisiti tecnici per l'integrazione SEND",
  "scheduledstart": "2025-02-25T10:00:00Z",
  "scheduledend": "2025-02-25T11:00:00Z",
  "location": "Microsoft Teams",
  "nextstep": "Follow-up entro 7 giorni",
  "dataProssimoContatto": "2025-03-04"
}
```

**Expected Behavior:**

- STEP 1: ✅ Account verification
- STEP 2: ✅ Contact verification/creation
- STEP 3: ✅ Appointment creation
- STEP 4: ⏭️ **SKIPPED** (no warning added)

**Response Example:**

```json
{
  "success": true,
  "dryRun": false,
  "activityId": "abc-123-def-456",
  "accountId": "account-uuid",
  "contactIds": ["contact-1-uuid", "contact-2-uuid"],
  "steps": [
    {
      "step": "verifyAccount",
      "success": true,
      "data": {...}
    },
    {
      "step": "verifyContacts",
      "success": true,
      "data": {...}
    },
    {
      "step": "createAppointment",
      "success": true,
      "data": {...}
    },
    {
      "step": "grantAccess",
      "success": true,
      "skipped": true,
      "dryRun": false
    }
  ],
  "warnings": [],
  "timestamp": "2025-02-21T14:30:00.000Z",
  "message": "Appuntamento creato con successo"
}
```

---

## 2. Request WITH GrantAccess Enabled

When `enableGrantAccess: true`, the GrantAccess step is executed (current behavior).

```json
{
  "enableGrantAccess": true,
  "institutionIdSelfcare": "d61bfa3b-1234-5678-90ab-cdef12345678",
  "productIdSelfcare": "prod-pn",
  "partecipanti": [
    {
      "email": "mario.rossi@ente.it",
      "nome": "Mario",
      "cognome": "Rossi",
      "tipologiaReferente": "TECNICO"
    }
  ],
  "subject": "Demo PagoPA SEND",
  "description": "Presentazione funzionalità e demo live",
  "scheduledstart": "2025-02-26T15:00:00Z",
  "scheduledend": "2025-02-26T16:00:00Z",
  "location": "Microsoft Teams",
  "enableCreateContact": true,
  "enableFallback": true
}
```

**Expected Behavior:**

- STEP 1: ✅ Account verification
- STEP 2: ✅ Contact verification/creation
- STEP 3: ✅ Appointment creation
- STEP 4: ✅ **GrantAccess executed**

**Response Example (Success):**

```json
{
  "success": true,
  "dryRun": false,
  "activityId": "xyz-789-ghi-012",
  "accountId": "account-uuid",
  "contactIds": ["contact-uuid"],
  "steps": [
    {
      "step": "verifyAccount",
      "success": true,
      "data": {...}
    },
    {
      "step": "verifyContacts",
      "success": true,
      "data": {...}
    },
    {
      "step": "createAppointment",
      "success": true,
      "data": {...}
    },
    {
      "step": "grantAccess",
      "success": true,
      "data": {
        "activityId": "xyz-789-ghi-012",
        "teamId": "sales-team-uuid"
      },
      "dryRun": false
    }
  ],
  "warnings": [],
  "timestamp": "2025-02-21T14:35:00.000Z",
  "message": "Appuntamento creato con successo"
}
```

**Response Example (GrantAccess Failed):**

```json
{
  "success": true,
  "dryRun": false,
  "activityId": "xyz-789-ghi-012",
  "accountId": "account-uuid",
  "contactIds": ["contact-uuid"],
  "steps": [
    {...},
    {
      "step": "grantAccess",
      "success": false,
      "data": {
        "activityId": "xyz-789-ghi-012",
        "teamId": "sales-team-uuid"
      },
      "error": "Team Sales non trovato in Dynamics",
      "dryRun": false
    }
  ],
  "warnings": [
    "GrantAccess fallito: Team Sales non trovato in Dynamics. L'appuntamento è stato creato ma potrebbe non essere visibile al team Sales."
  ],
  "timestamp": "2025-02-21T14:35:00.000Z",
  "message": "Appuntamento creato con successo"
}
```

---

## 3. Dry-Run Mode (Testing)

```json
{
  "dryRun": true,
  "enableGrantAccess": false,
  "institutionIdSelfcare": "test-institution-id",
  "productIdSelfcare": "prod-io",
  "partecipanti": [
    {
      "email": "test@example.com",
      "nome": "Test",
      "cognome": "User"
    }
  ],
  "subject": "Test Appointment",
  "scheduledstart": "2025-03-01T09:00:00Z",
  "scheduledend": "2025-03-01T10:00:00Z"
}
```

**Expected Behavior:**

- All steps simulated (no actual API calls)
- GrantAccess skipped (both due to dry-run and enableGrantAccess=false)

---

## Migration Guide

### For Existing Clients

**No changes required!** The `enableGrantAccess` parameter is optional and defaults to `false`.

- If your current requests **do not** include `enableGrantAccess`, the GrantAccess step will be **skipped** (new behavior)
- If you want to **enable** GrantAccess, add `"enableGrantAccess": true` to your request payload

### Recommended Usage

| Scenario                                | enableGrantAccess | Notes                                     |
| --------------------------------------- | ----------------- | ----------------------------------------- |
| Standard meeting creation               | `false` or omit   | Default behavior, no GrantAccess overhead |
| Meeting requiring Sales team visibility | `true`            | Explicitly grant access to Sales team     |
| Testing/development                     | `false`           | Skip GrantAccess to avoid dependencies    |
| Production (critical meetings)          | `true`            | Ensure Sales team can see the appointment |

---

## Logging Examples

### When GrantAccess is Skipped (enableGrantAccess: false)

```
🚀 Starting meeting orchestrator { enableGrantAccess: false, ... }
📋 STEP 1/4: Account verification
✅ STEP 1 COMPLETED
📋 STEP 2/4: Contact verification
✅ STEP 2 COMPLETED
📋 STEP 3/4: Create appointment
✅ STEP 3 COMPLETED
ℹ️ STEP 4 SKIPPED: GrantAccess disabled via request parameter
✅ ORCHESTRATOR COMPLETED SUCCESSFULLY
```

### When GrantAccess is Enabled (enableGrantAccess: true)

```
🚀 Starting meeting orchestrator { enableGrantAccess: true, ... }
📋 STEP 1/4: Account verification
✅ STEP 1 COMPLETED
📋 STEP 2/4: Contact verification
✅ STEP 2 COMPLETED
📋 STEP 3/4: Create appointment
✅ STEP 3 COMPLETED
📋 STEP 4/4: Grant access to Sales team
✅ STEP 4 COMPLETED: Access granted to Sales team { teamId: "...", duration: "45ms" }
✅ ORCHESTRATOR COMPLETED SUCCESSFULLY
```

### When GrantAccess Fails (enableGrantAccess: true)

```
🚀 Starting meeting orchestrator { enableGrantAccess: true, ... }
...
📋 STEP 4/4: Grant access to Sales team
⚠️ STEP 4 WARNING: GrantAccess failed { error: "Team not found", duration: "120ms" }
✅ ORCHESTRATOR COMPLETED SUCCESSFULLY (with warnings)
```
