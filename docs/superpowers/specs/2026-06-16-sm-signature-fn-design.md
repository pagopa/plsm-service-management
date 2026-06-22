# Design — sm-signature-fn (validazione firma documenti DSS)

- **Task**: SMION-756 — Integrare la funzionalità di verifica firma documenti esposta dal container DSS su Dev_Platform_SM
- **Data**: 2026-06-16
- **Stato**: Approvato (brainstorming) → input per writing-plans

## 1. Obiettivo

Come SMCR, poter verificare in autonomia (senza tool esterni) la firma di un file
`.pdf` o `.p7m`, sfruttando il container DSS API già esposto. La verifica deve
restituire un JSON strutturato con l'esito di ogni firma presente nel file.

In questo iter **non si realizza il frontend**: lo svilupperà un altro collega.
Deliverable di questo lavoro:

1. Nuova Azure Function `apps/sm-signature-fn`.
2. Infrastruttura Terraform della function (in un branch `infra/*` separato).
3. Documento di contratto API chiaro per il collega frontend.

## 2. Decisioni di design (esito brainstorming)

| Tema | Decisione |
| --- | --- |
| Backend | Nuova Azure Function dedicata `sm-signature-fn` (Function v4, TypeScript) |
| Gestione `.p7m` | Inviati a DSS **così come sono** (DSS valida nativamente i CAdES). **Nessun** parser ASN.1 (no pkijs/asn1js) |
| Frontend | Fuori scope ora (lo farà un collega). Si consegna solo il contratto API |
| Autenticazione | **Function key** nativa di Azure (`x-functions-key` o `?code=...`), `authLevel: "function"` |
| Mapping risposta DSS | Difensivo, campi opzionali, marcato "da verificare con risposta reale" |

## 3. Architettura e strategia di branch

Il repo impone (vedi `docs/INFRASTRUCTURE_WORKFLOW.md` e guida YAML interna) la
separazione tra codice applicativo e infrastruttura:

- **`smion-756-signature-fn`** (feature branch, da `main`): SOLO codice
  applicativo → `apps/sm-signature-fn/` + documento contratto API.
- **`infra-smion-756`** (branch infra, da `main`): SOLO infrastruttura → blocco
  YAML `signature`, rigenerazione `locals_yaml.tf`/`data_kv.tf`, `signature.tf`,
  subnet CIDR, role assignment.

> Terraform apply gira solo da `main` (prod automatico, dev via manual dispatch).
> Il branch infra va aperto in PR separata e mergiato prima di poter usare le
> risorse dal feature branch.

### Flusso runtime

```
Frontend (collega)
  │  multipart/form-data { file: .pdf|.p7m }, header x-functions-key
  ▼
sm-signature-fn  POST /api/v1/validate-signature
  │  legge file → base64
  ▼
DSS API  POST {DSS_API_BASE_URL}/services/rest/validation/validateSignature
  │  { signedDocument: { bytes, name }, policy: null, tokenExtractionStrategy: "NONE" }
  ▼
sm-signature-fn  mappa SimpleReport DSS → ValidationResponse
  │
  ▼
Frontend  ← JSON strutturato (badge VALIDA/INDETERMINATA/NON VALIDA)
```

## 4. Azure Function `sm-signature-fn`

Struttura allineata a `apps/sm-certification-fn` (Function v4, `host.json`,
`tsconfig.json`, `utils/checkConfig.ts`, registrazione handler in `index.ts`).

```
apps/sm-signature-fn/
  host.json
  package.json
  tsconfig.json
  local.settings.json.sample
  env.sample
  .funcignore
  .gitignore
  README.md                  # contratto API (deliverable §7)
  signature/
    index.ts                 # app.http: validate-signature + health
    handler.ts               # orchestrazione: parse multipart → callDss → map
    dss.ts                   # callDssApi() + mapping SimpleReport → SignatureResult[]
    health.ts
    models/signature.ts      # tipi ValidationResponse / SignatureResult
  utils/
    checkConfig.ts           # validazione env (DSS_API_BASE_URL, ...)
```

### Endpoint

- `POST /api/v1/validate-signature` — `authLevel: "function"`
  - Content-Type: `multipart/form-data`, campo `file`
  - Validazioni: file presente e non vuoto; dimensione ≤ 10 MB (come
    `app/api/contract/upload`); estensione/MIME in `{.pdf, .p7m}`
- `GET /api/v1/health` — `authLevel: "anonymous"`, per health check infra

### Config (`utils/checkConfig.ts`)

- `DSS_API_BASE_URL` (obbligatoria) — base URL del container DSS, **no hardcode**
- Eventuale `MAX_FILE_SIZE_BYTES` (opzionale, default 10 MB)

## 5. Logica DSS (`dss.ts`)

`callDssApi(bytes: string, name: string)` esegue:

```
POST {DSS_API_BASE_URL}/services/rest/validation/validateSignature
Content-Type: application/json
{
  "signedDocument": { "bytes": "<base64>", "name": "<filename>" },
  "policy": null,
  "tokenExtractionStrategy": "NONE"
}
```

### Mapping risposta → `SignatureResult`

La risposta DSS contiene un `SimpleReport` con un array di firme. Mapping previsto
(**da verificare con una risposta reale**; accesso difensivo con campi opzionali):

| Campo `SignatureResult` | Origine DSS (SimpleReport) |
| --- | --- |
| `signerName` | `signatureOrTimestamp[].SignedBy` |
| `indication` | `signatureOrTimestamp[].Indication` |
| `signatureLevel` | `signatureOrTimestamp[].SignatureLevel` |
| `signingTime` | `signatureOrTimestamp[].SigningTime` |
| `qtsp` | trust anchor / certificate chain (logica `_estrai_trust_anchor`) |
| `country` | trust anchor / certificate chain |
| `issues` | `Errors` / `Warnings` della firma |

- `totalSignatures` = numero di firme nel report.
- `validSignatures` = conteggio firme con `indication === "TOTAL_PASSED"`.
- Se il mapping reale dei campi differisce, si adegua il parser senza cambiare il
  contratto verso il frontend.

### Gestione errori

| Situazione | HTTP | Body |
| --- | --- | --- |
| File mancante / vuoto | 400 | `{ error: "Missing file" }` |
| File troppo grande | 400 | `{ error: "File too large" }` |
| Estensione/MIME non supportati | 415 | `{ error: "Unsupported file type" }` |
| DSS non riconosce il documento | 422 | `{ error: "Document format not recognized" }` |
| DSS irraggiungibile / 5xx | 502 | `{ error: "Signature validation service unavailable" }` |

## 6. Tipi del contratto

```ts
type SignatureIndication = "TOTAL_PASSED" | "INDETERMINATE" | "TOTAL_FAILED";

type SignatureResult = {
  signerName: string;
  qtsp: string;
  country: string;
  indication: SignatureIndication;
  signatureLevel: string;
  signingTime: string;
  issues?: string[];
};

type ValidationResponse = {
  fileName: string;
  fileType: "pdf" | "p7m";
  signatures: SignatureResult[];
  totalSignatures: number;
  validSignatures: number;
};
```

## 7. Documento contratto API (deliverable)

`apps/sm-signature-fn/README.md` con:

- Endpoint, metodo, autenticazione (function key via `x-functions-key` o `?code=`)
- Request `multipart/form-data` (campo `file`), limiti dimensione e tipi accettati
- Esempi `curl` per `.pdf` e `.p7m`
- Schema `ValidationResponse` / `SignatureResult` con descrizione campi
- Tabella codici di errore (§5)
- Esempi di risposta JSON (pdf con 1 firma valida; p7m con firma indeterminata)

## 8. Infrastruttura (branch `infra-smion-756`)

Procedura da guida YAML interna del repo:

1. `infra/resources/environments/common.yaml` — nuovo blocco:
   ```yaml
   signature:
     __local: yaml_signature_func
     DSS_API_BASE_URL: "http://dss-api-dem.northeurope.azurecontainer.io:8080"
   ```
   (URL interno uguale per tutti gli ambienti → `common.yaml`). Eventuali valori
   per-ambiente andrebbero in `dev.yaml` / `prod.yaml`.
2. Rigenerare i locals:
   ```
   python3 infra/scripts/generate_locals.py --env dev
   python3 infra/scripts/generate_locals.py --env prod
   ```
   (aggiorna `locals_yaml.tf` e `data_kv.tf`; non editarli a mano).
3. `infra/resources/prod/signature.tf` e `infra/resources/dev/signature.tf`:
   modulo `../_modules/function_app` con
   `app_name="sig"`, `instance_number="01"`, `node_version=22`,
   `health_check_path="/api/v1/health"`,
   `app_settings = merge(local.common_app_settings, local.yaml_signature_func_app_settings)`.
4. `network_cidrs.tf`: nuova subnet CIDR dedicata
   (`dx_available_subnet_cidr.signature_fa_subnet_cidr`).
5. Role assignment `Website Contributor` per la CD identity sulla nuova function.

### Networking

La function chiama un endpoint **pubblico**
(`dss-api-dem.northeurope.azurecontainer.io:8080`). Da verificare che l'outbound
dalla subnet della function lo consenta (le altre function chiamano API pubbliche
SelfCare, quindi atteso OK). L'endpoint è raggiungibile (probe: risponde HTTP 500
con messaggio "Document format not recognized" su payload fittizio).

## 9. Testing

- Unit test del mapping DSS → `ValidationResponse` con fixture JSON (caso valido,
  indeterminato, fallito, multi-firma).
- Unit test validazione input (file mancante, troppo grande, tipo non supportato).
- Test gestione errori DSS (timeout / 5xx → 502).
- (Allineare al runner usato dalle altre function; `sm-certification-fn` non ha
  test, valutare jest leggero come nel FE.)

## 10. Fuori scope

- Frontend SMCR (pagina upload + badge): lo realizza un altro collega usando il
  contratto API di §7.
- Estrazione del PDF interno dai `.p7m` (no parser ASN.1).
- Persistenza dei risultati di validazione (nessun DB).

## 11. Punti aperti / rischi

- Nomi esatti dei campi DSS nel `SimpleReport` da confermare con risposta reale.
- Determinazione di `qtsp`/`country` dal trust anchor: logica da affinare sui dati
  reali.
- Confermare che l'outbound verso il container DSS sia permesso dalla subnet.
