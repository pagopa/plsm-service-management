# 🔍 Sistema di Logging - CRM Function

Sistema di logging strutturato ottimizzato per Azure Functions e Application Insights.

## Quick Start

```typescript
import { createLogger, Timer } from "./_shared/utils/logger";

// In un handler Azure Function
export async function myHandler(
  request: HttpRequest,
  context: InvocationContext,
) {
  const logger = createLogger(context, { userId: "123" });
  const timer = new Timer();

  logger.info("Starting operation", { operationType: "search" });

  try {
    // ... your code ...

    logger.info("Operation successful", {
      duration: timer.elapsed(),
      resultCount: 10,
    });
  } catch (error) {
    logger.error("Operation failed", error, {
      duration: timer.elapsed(),
    });
  }
}
```

## Log Levels

| Level    | Emoji            | Uso                     | Produzione         |
| -------- | ---------------- | ----------------------- | ------------------ |
| 🔍 DEBUG | `logger.debug()` | Dettagli implementativi | Solo se DEBUG=true |
| ℹ️ INFO  | `logger.info()`  | Operazioni normali      | ✅ Sempre          |
| ⚠️ WARN  | `logger.warn()`  | Anomalie gestite        | ✅ Sempre          |
| ❌ ERROR | `logger.error()` | Errori bloccanti        | ✅ Sempre          |

## Metadata Comuni

```typescript
interface LogMetadata {
  requestId?: string;
  accountId?: string;
  contactId?: string;
  email?: string;
  activityId?: string;
  productId?: string;
  institutionId?: string;
  duration?: number;
  url?: string;
  statusCode?: number;
  method?: string;
  odataFilter?: string;
  resultCount?: number;
  dryRun?: boolean;
}
```

## Utilities

### Timer

```typescript
const timer = new Timer();
// ... operation ...
const elapsed = timer.elapsed(); // millisecondi
timer.logElapsed(logger, "My Operation");
```

### HTTP Logging

```typescript
import { logHttpRequest, logHttpResponse } from "./_shared/utils/logger";

logHttpRequest(logger, "GET", url);
// ... fetch ...
logHttpResponse(logger, "GET", url, 200, timer.elapsed(), resultCount);
```

### OData Query Logging

```typescript
import { logODataQuery } from "./_shared/utils/logger";

logODataQuery(logger, "/api/data/v9.2/contacts", filter, select, top);
```

## Child Loggers

Crea logger con metadata condivisi:

```typescript
const parentLogger = createLogger(context);
const childLogger = parentLogger.child({ accountId: "123" });

childLogger.info("Child operation"); // Include automaticamente accountId
```

## Application Insights Query

```kusto
traces
| where message contains "duration"
| extend metadata = parse_json(tostring(customDimensions.metadata))
| where metadata.duration > 1000
| project timestamp, message, duration=metadata.duration
| order by duration desc
```

## Configurazione

### Development

```bash
export DEBUG=true
```

### Azure Function App

Aggiungi nelle Application Settings:

```
DEBUG=false  # true solo per staging/dev
```

## Best Practices

1. ✅ Usa `info` per operazioni normali
2. ✅ Usa `warn` per situazioni anomale ma gestite
3. ✅ Usa `error` solo per fallimenti bloccanti
4. ✅ Includi sempre metadata rilevanti
5. ❌ Non loggare dati sensibili (password, token, PII)
6. ✅ Usa timer per misurare performance
7. ✅ Logga conteggi risultati per statistiche

## Esempi

### GET Handler

```typescript
export async function getContactsHandler(
  request: HttpRequest,
  context: InvocationContext,
) {
  const logger = createLogger(context);
  logger.info("HTTP GET /contacts request received");

  const accountId = request.query.get("accountId");
  logger.debug("Query parameters", { accountId });

  if (!accountId) {
    logger.warn("Missing required parameter", { hasAccountId: false });
    return { status: 400, jsonBody: { error: "Missing accountId" } };
  }

  const result = await getContactsByAccountId(accountId);
  logger.info("Contacts retrieved", {
    accountId,
    count: result.value.length,
  });

  return { status: 200, jsonBody: result };
}
```

### POST Handler con Timer

```typescript
export async function createContactHandler(
  request: HttpRequest,
  context: InvocationContext,
) {
  const logger = createLogger(context);
  const timer = new Timer();

  logger.info("Creating contact");

  try {
    const body = await request.json();
    logger.debug("Request body received", { email: body.email });

    const contact = await createContact(body);

    logger.info("Contact created successfully", {
      contactId: contact.contactid,
      duration: timer.elapsed(),
    });

    return { status: 201, jsonBody: contact };
  } catch (error) {
    logger.error("Failed to create contact", error, {
      duration: timer.elapsed(),
    });
    return { status: 500, jsonBody: { error: "Internal error" } };
  }
}
```

### Service con Step Logging

```typescript
async function processData(data: MyData) {
  const logger = createLogger(undefined, { dataId: data.id });
  const overallTimer = new Timer();

  logger.info("Starting data processing");

  // Step 1
  logger.info("Step 1/3: Validation");
  const stepTimer = new Timer();
  await validateData(data);
  logger.info("Step 1 completed", { duration: stepTimer.elapsed() });

  // Step 2
  logger.info("Step 2/3: Transformation");
  const step2Timer = new Timer();
  const transformed = await transformData(data);
  logger.info("Step 2 completed", {
    duration: step2Timer.elapsed(),
    recordsProcessed: transformed.length,
  });

  // Step 3
  logger.info("Step 3/3: Saving");
  const step3Timer = new Timer();
  await saveData(transformed);
  logger.info("Step 3 completed", { duration: step3Timer.elapsed() });

  logger.info("Data processing completed", {
    totalDuration: overallTimer.elapsed(),
    recordsProcessed: transformed.length,
  });
}
```

---

Per dettagli completi vedi [CHANGELOG_LOGGING.md](./CHANGELOG_LOGGING.md)
