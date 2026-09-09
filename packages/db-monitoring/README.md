# @repo/db-monitoring

Schema, migrazioni e query del database **`monitoring`**, che traccia le call create dal tool di Service Management.

Questo package è l'unico proprietario del database: nessuna app definisce tabelle o scrive SQL per conto proprio.

## Cosa contiene

| Percorso | Contenuto |
|---|---|
| `src/schema.ts` | Definizione della tabella `calls` e dei tipi |
| `src/client.ts` | Connessione al database (singleton) |
| `src/queries/calls.ts` | Funzioni di dominio tipizzate |
| `migrations/` | SQL versionato, generato da drizzle-kit |

## Uso

```ts
import { upsertCall, listCalls, PRODUCT_IDS } from "@repo/db-monitoring";

// Registra una call. Idempotente: un retry con lo stesso crmActivityId
// aggiorna la riga esistente invece di duplicarla.
const id = await upsertCall({
  crmActivityId: appointment.activityid,
  title: "Incontro tecnico",
  institutionId: "22222222-2222-2222-2222-222222222222",
  institutionName: "Comune di Roma",
  productId: "prod-pn",
  callDate: new Date("2026-01-15T10:00:00Z"),
  link: "https://meet.example.com/abc",
});

// Legge le call più recenti
const recenti = await listCalls({ limit: 20, productId: "prod-io" });
```

## Configurazione

Copia `.env.example` in `.env` e valorizza `MONITORING_DATABASE_URL`:

```bash
cp packages/db-monitoring/.env.example packages/db-monitoring/.env

az keyvault secret show \
  --vault-name plsm-p-itn-common-kv-01 \
  --name monitoring-database-url \
  --query value -o tsv
```

Non committare mai il `.env` né incollare la connection string in Jira, Slack o nelle PR.

## Comandi

Da eseguire dalla root del monorepo.

| Comando | Cosa fa | Serve la VPN? |
|---|---|---|
| `yarn workspace @repo/db-monitoring db:generate --name <nome>` | Genera la migrazione dal diff dello schema | no |
| `yarn workspace @repo/db-monitoring db:migrate` | Applica le migrazioni non ancora eseguite | **sì** |
| `yarn workspace @repo/db-monitoring db:migrate:prod` | Come sopra, con `.env.prod` | **sì** |
| `yarn workspace @repo/db-monitoring db:studio` | Ispeziona i dati da browser | **sì** |
| `yarn workspace @repo/db-monitoring test` | Test | no |
| `yarn workspace @repo/db-monitoring check-types` | Controllo dei tipi | no |
| `yarn workspace @repo/db-monitoring build` | Compila in `dist/` | no |

## Modificare lo schema

```bash
# 1. Modifica src/schema.ts

# 2. Genera la migrazione (non tocca il database)
yarn workspace @repo/db-monitoring db:generate --name add_call_participants

# 3. LEGGI l'SQL generato prima di applicarlo
cat packages/db-monitoring/migrations/*_add_call_participants/migration.sql

# 4. Applica su dev
yarn workspace @repo/db-monitoring db:migrate

# 5. Verifica
yarn workspace @repo/db-monitoring check-types
yarn workspace @repo/db-monitoring test

# 6. Committa schema e migrazione insieme
git add packages/db-monitoring/src/schema.ts packages/db-monitoring/migrations
```

In produzione il passo 4 diventa `db:migrate:prod`, da eseguire **prima** del deploy del codice che dipende dalla modifica.

### Regole

1. **Mai modificare una migrazione già applicata** su un ambiente condiviso. Si corregge con una migrazione nuova: sono forward-only.
2. **Mai `drizzle-kit push`** su dev o prod: sincronizza lo schema senza produrre file di migrazione e fa divergere gli ambienti.
3. **Leggere sempre `migration.sql`** prima di applicarlo. Rinomine e cambi di tipo possono essere generati come drop+create, con perdita di dati.
4. **Separare le migrazioni distruttive da quelle additive**: prima si rilascia l'aggiunta, si migra il codice, poi in una release successiva si rimuove il vecchio.
5. **Nome descrittivo** per ogni migrazione, via `--name`.

### Aggiungere o rimuovere un prodotto

Modifica `PRODUCT_IDS` in `src/schema.ts` e rigenera. La migrazione risultante è un unico statement, senza riscrittura dei dati:

```sql
ALTER TABLE "calls"
  DROP CONSTRAINT "calls_product_id_check",
  ADD CONSTRAINT "calls_product_id_check" CHECK ("product_id" IN ('prod-io','prod-interop','prod-pn','prod-pagopa','prod-io-sign','prod-nuovo'));
```

## Diagnostica

| Sintomo | Causa probabile | Rimedio |
|---|---|---|
| `ETIMEDOUT` / `ENOTFOUND` sull'host | VPN non attiva | attivare la VPN |
| `MONITORING_DATABASE_URL is required…` | `.env` mancante | vedi *Configurazione* |
| `password authentication failed` | secret non allineato alle credenziali in Key Vault | rileggere `monitoring-database-url` |
| `database "monitoring" does not exist` | Terraform non ancora applicato | `terraform apply` in `infra/resources/<env>` |
| `db:generate` non produce nulla | schema identico all'ultimo snapshot | atteso: nessuna modifica da migrare |
| `too many connections` | connessioni non riusate (limite server: 50) | usare `getMonitoringDb()`, non creare client propri |

### Verifiche senza VPN

```bash
# Il database esiste?
az postgres flexible-server db list \
  --resource-group plsm-p-itn-common-rg-01 \
  --server-name plsm-p-itn-apps-psql-01 \
  --query "[].name" -o tsv

# Il secret esiste? (non ne stampa il valore)
az keyvault secret list --vault-name plsm-p-itn-common-kv-01 \
  --query "[?name=='monitoring-database-url'].name" -o tsv
```
