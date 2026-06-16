# sm-signature-fn

Azure Function (v4, TypeScript) that validates the digital signature of a `.pdf`
or `.p7m` file by delegating to the DSS validation container, and returns a
stable JSON contract for the SMCR frontend.

## Endpoints

### `POST /api/v1/validate-signature`

- **Auth:** Azure function key. Pass it as the `x-functions-key` header or the
  `?code=<key>` query parameter.
- **Request:** `multipart/form-data` with a single field `file` (`.pdf` or
  `.p7m`, max 10 MB by default — see `MAX_FILE_SIZE_BYTES`).
- **Response:** `application/json` — see `ValidationResponse` below.

#### Example

```bash
curl -X POST \
  "https://<function-host>/api/v1/validate-signature" \
  -H "x-functions-key: <FUNCTION_KEY>" \
  -F "file=@/path/to/document.pdf"
```

#### Response types

```ts
type SignatureIndication = "TOTAL_PASSED" | "INDETERMINATE" | "TOTAL_FAILED";

type SignatureResult = {
  signerName: string;     // common name of the signer
  qtsp: string;           // qualified trust service provider (issuer/anchor)
  country: string;        // ISO country code of the trust anchor
  indication: SignatureIndication; // overall signature verdict
  signatureLevel: string; // e.g. "PAdES-BASELINE-LT"
  signingTime: string;    // ISO-8601
  issues?: string[];      // DSS errors + warnings, if any
};

type ValidationResponse = {
  fileName: string;
  fileType: "pdf" | "p7m";
  signatures: SignatureResult[];
  totalSignatures: number;
  validSignatures: number; // count of indication === "TOTAL_PASSED"
};
```

#### Suggested badge mapping (frontend)

| `indication`    | Badge                  |
| --------------- | ---------------------- |
| `TOTAL_PASSED`  | VALIDA (verde)         |
| `INDETERMINATE` | INDETERMINATA (giallo) |
| `TOTAL_FAILED`  | NON VALIDA (rosso)     |

#### Error responses

| HTTP | Body                                                      | Cause                        |
| ---- | --------------------------------------------------------- | ---------------------------- |
| 400  | `{ "error": "Missing file field" }`                       | No `file` field in form-data |
| 400  | `{ "error": "Missing or empty file" }`                    | Empty file                   |
| 400  | `{ "error": "File too large" }`                           | Over size limit              |
| 400  | `{ "error": "Invalid multipart/form-data" }`              | Body not multipart           |
| 415  | `{ "error": "Unsupported file type" }`                    | Not `.pdf`/`.p7m`            |
| 422  | `{ "error": "Document format not recognized" }`           | DSS could not parse the file |
| 502  | `{ "error": "Signature validation service unavailable" }` | DSS unreachable / 5xx        |
| 500  | `{ "error": "Configurazione mancante o invalida." }`      | Missing env config           |

### `GET /api/v1/health`

Anonymous warm-up endpoint. Returns `200 OK`.

## Configuration

| Env var               | Required | Default    | Description                                       |
| --------------------- | -------- | ---------- | ------------------------------------------------- |
| `DSS_API_BASE_URL`    | yes      | —          | Base URL of the DSS container (no trailing slash) |
| `MAX_FILE_SIZE_BYTES` | no       | `10485760` | Max upload size in bytes                          |

## Local development

```bash
cp local.settings.json.sample local.settings.json
yarn install
yarn build
yarn start   # func start
```

## Notes for the frontend

- `.p7m` files are sent to DSS as-is; the original embedded PDF is **not**
  extracted or returned.
- The DSS field mapping (`signerName`, `qtsp`, `country`, ...) is best-effort and
  should be re-verified against a real signed document; the public contract above
  is stable regardless.
