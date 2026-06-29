# SM Signature Fn Nested P7M Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `sm-signature-fn` so `.p7m` files with nested CMS envelopes return all signatures from each level in a single `ValidationResponse`.

**Architecture:** Keep DSS as the signature validator and add a small CMS extraction layer in the Function. For `.p7m`, validate the current envelope, extract the signed CMS payload, repeat while the payload is another CMS envelope, then merge all mapped signatures in outer-to-inner order without changing the frontend response contract.

**Tech Stack:** Azure Functions v4, TypeScript, Jest, DSS REST API, `pkijs`, `asn1js`.

---

## File structure

- Modify `apps/sm-signature-fn/package.json`
  - Add runtime dependencies `pkijs` and `asn1js`.
- Modify `apps/sm-signature-fn/signature/models/signature.ts`
  - Keep DSS response types aligned with the real `SimpleReport.signatureOrTimestampOrEvidenceRecord[].Signature` shape.
- Modify `apps/sm-signature-fn/signature/dss.ts`
  - Keep mapping of real DSS shape and normalized `SignatureLevel`.
- Create `apps/sm-signature-fn/signature/cms.ts`
  - Parse CMS/PKCS#7 `SignedData` and extract encapsulated signed content.
  - Return `null` when content is not extractable or is not CMS.
- Create `apps/sm-signature-fn/signature/nestedP7m.ts`
  - Orchestrate recursive validation: DSS call per level, CMS extraction between levels, merge mapped responses.
- Modify `apps/sm-signature-fn/signature/handler.ts`
  - Use nested validation only for `.p7m`; keep `.pdf` behavior unchanged.
- Modify `apps/sm-signature-fn/__tests__/dss.test.ts`
  - Keep regression coverage for real DSS response shape.
- Create `apps/sm-signature-fn/__tests__/cms.test.ts`
  - Test CMS extraction behavior using minimal/mocked ASN.1 or a generated fixture.
- Create `apps/sm-signature-fn/__tests__/nestedP7m.test.ts`
  - Test recursive validation and aggregation without hitting DSS network.

## Task 1: Lock current DSS real-shape mapping

**Files:**
- Modify: `apps/sm-signature-fn/__tests__/dss.test.ts`
- Modify: `apps/sm-signature-fn/signature/models/signature.ts`
- Modify: `apps/sm-signature-fn/signature/dss.ts`

- [ ] **Step 1: Ensure the regression test exists**

Add this test to `apps/sm-signature-fn/__tests__/dss.test.ts` inside `describe("mapDssResponse", ...)`:

```ts
it("maps the DSS SimpleReport signatureOrTimestampOrEvidenceRecord shape", () => {
  const realDssShape = {
    SimpleReport: {
      SignaturesCount: 1,
      ValidSignaturesCount: 1,
      signatureOrTimestampOrEvidenceRecord: [
        {
          Signature: {
            SignedBy: "Mario Rossi",
            Indication: "TOTAL_PASSED",
            SignatureLevel: {
              description: "Qualified Electronic Signature",
              value: "QESig",
            },
            BestSignatureTime: "2026-06-23T08:53:51Z",
          },
        },
      ],
    },
  } as DssValidationReport;

  const result = mapDssResponse(realDssShape, "doc.p7m", "p7m");

  expect(result.totalSignatures).toBe(1);
  expect(result.validSignatures).toBe(1);
  expect(result.signatures[0]).toEqual({
    signerName: "Mario Rossi",
    qtsp: "",
    country: "",
    indication: "TOTAL_PASSED",
    signatureLevel: "QESig",
    signingTime: "2026-06-23T08:53:51Z",
    issues: [],
  });
});
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
cd apps/sm-signature-fn
yarn test --runTestsByPath __tests__/dss.test.ts
```

Expected: PASS. If it fails, finish the already-started real-shape mapper fix before proceeding.

- [ ] **Step 3: Commit current mapper fix**

Run:

```bash
git add apps/sm-signature-fn/__tests__/dss.test.ts \
  apps/sm-signature-fn/signature/dss.ts \
  apps/sm-signature-fn/signature/models/signature.ts
git commit -m "fix(signature-fn): map real DSS signature report shape"
```

## Task 2: Add CMS parsing dependency and extractor

**Files:**
- Modify: `apps/sm-signature-fn/package.json`
- Create: `apps/sm-signature-fn/signature/cms.ts`
- Create: `apps/sm-signature-fn/__tests__/cms.test.ts`

- [ ] **Step 1: Install dependencies**

Run:

```bash
cd apps/sm-signature-fn
yarn add pkijs asn1js
```

Expected: `package.json` and the repo lockfile update with `pkijs` and `asn1js`.

- [ ] **Step 2: Write the failing CMS test**

Create `apps/sm-signature-fn/__tests__/cms.test.ts`:

```ts
import { extractCmsSignedContent } from "../signature/cms";

describe("extractCmsSignedContent", () => {
  it("returns null for non-ASN.1 content", () => {
    const pdfBytes = Buffer.from("%PDF-1.7\n", "utf8");

    expect(extractCmsSignedContent(pdfBytes)).toBeNull();
  });

  it("extracts the signed content from the outer p7m fixture", () => {
    const fixture = Buffer.from(
      "308006092a864886f70d010702a08030800201013100300b06092a864886f70d010701a080240568656c6c6f00000000",
      "hex",
    );

    const extracted = extractCmsSignedContent(fixture);

    expect(extracted).not.toBeNull();
    expect(Buffer.from(extracted ?? [])).toEqual(Buffer.from("hello", "utf8"));
  });
});
```

The fixture is a minimal BER CMS `ContentInfo`/`SignedData` with encapsulated `data` content `hello`.

- [ ] **Step 3: Run the CMS test to verify RED**

Run:

```bash
cd apps/sm-signature-fn
yarn test --runTestsByPath __tests__/cms.test.ts
```

Expected: FAIL because `../signature/cms` does not exist.

- [ ] **Step 4: Implement the extractor**

Create `apps/sm-signature-fn/signature/cms.ts`:

```ts
import * as asn1js from "asn1js";
import { ContentInfo, SignedData } from "pkijs";

export function extractCmsSignedContent(input: Uint8Array): Uint8Array | null {
  const arrayBuffer = input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  );
  const asn1 = asn1js.fromBER(arrayBuffer);

  if (asn1.offset === -1) {
    return null;
  }

  try {
    const contentInfo = new ContentInfo({ schema: asn1.result });
    const signedData = new SignedData({ schema: contentInfo.content });
    const eContent = signedData.encapContentInfo.eContent;

    if (!eContent) {
      return null;
    }

    return new Uint8Array(eContent.valueBlock.valueHex);
  } catch {
    return null;
  }
}
```

- [ ] **Step 5: Run the CMS test to verify GREEN**

Run:

```bash
cd apps/sm-signature-fn
yarn test --runTestsByPath __tests__/cms.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit CMS extractor**

Run:

```bash
git add apps/sm-signature-fn/package.json yarn.lock \
  apps/sm-signature-fn/signature/cms.ts \
  apps/sm-signature-fn/__tests__/cms.test.ts
git commit -m "feat(signature-fn): extract signed CMS content"
```

## Task 3: Add recursive nested P7M validation orchestrator

**Files:**
- Create: `apps/sm-signature-fn/signature/nestedP7m.ts`
- Create: `apps/sm-signature-fn/__tests__/nestedP7m.test.ts`

- [ ] **Step 1: Write failing aggregation test**

Create `apps/sm-signature-fn/__tests__/nestedP7m.test.ts`:

```ts
import { validateNestedP7m } from "../signature/nestedP7m";
import type { AppConfig } from "../utils/checkConfig";
import type { DssValidationReport } from "../signature/models/signature";

const config: AppConfig = {
  dssApiBaseUrl: "http://dss.example",
  maxFileSizeBytes: 10 * 1024 * 1024,
};

function reportFor(name: string): DssValidationReport {
  return {
    SimpleReport: {
      SignaturesCount: 1,
      ValidSignaturesCount: 1,
      signatureOrTimestampOrEvidenceRecord: [
        {
          Signature: {
            SignedBy: name,
            Indication: "TOTAL_PASSED",
            SignatureFormat: "CAdES-BASELINE-B",
            BestSignatureTime: "2026-06-23T08:53:51Z",
          },
        },
      ],
    },
  };
}

describe("validateNestedP7m", () => {
  it("validates each nested p7m level and aggregates signatures outer-to-inner", async () => {
    const callDssApi = jest
      .fn()
      .mockResolvedValueOnce(reportFor("LORENZO FREDIANELLI"))
      .mockResolvedValueOnce(reportFor("VIONI RICCARDO"))
      .mockResolvedValueOnce(reportFor("Stefania Zammarchi"));
    const extractCmsSignedContent = jest
      .fn()
      .mockReturnValueOnce(Buffer.from("level-1"))
      .mockReturnValueOnce(Buffer.from("level-2"))
      .mockReturnValueOnce(Buffer.from("%PDF-1.7\n"));

    const result = await validateNestedP7m({
      bytes: Buffer.from("level-0"),
      callDssApi,
      config,
      extractCmsSignedContent,
      fileName: "doc.pdf.p7m.p7m.p7m",
      maxDepth: 5,
    });

    expect(callDssApi).toHaveBeenCalledTimes(3);
    expect(extractCmsSignedContent).toHaveBeenCalledTimes(3);
    expect(result.totalSignatures).toBe(3);
    expect(result.validSignatures).toBe(3);
    expect(result.signatures.map((signature) => signature.signerName)).toEqual([
      "LORENZO FREDIANELLI",
      "VIONI RICCARDO",
      "Stefania Zammarchi",
    ]);
  });
});
```

- [ ] **Step 2: Run the nested test to verify RED**

Run:

```bash
cd apps/sm-signature-fn
yarn test --runTestsByPath __tests__/nestedP7m.test.ts
```

Expected: FAIL because `../signature/nestedP7m` does not exist.

- [ ] **Step 3: Implement nested validation**

Create `apps/sm-signature-fn/signature/nestedP7m.ts`:

```ts
import type { AppConfig } from "../utils/checkConfig";
import type { DssValidationReport, ValidationResponse } from "./models/signature";
import { callDssApi as defaultCallDssApi, mapDssResponse } from "./dss";
import { extractCmsSignedContent as defaultExtractCmsSignedContent } from "./cms";

type ValidateNestedP7mInput = {
  bytes: Uint8Array;
  callDssApi?: (
    config: AppConfig,
    bytesBase64: string,
    fileName: string,
  ) => Promise<DssValidationReport>;
  config: AppConfig;
  extractCmsSignedContent?: (input: Uint8Array) => Uint8Array | null;
  fileName: string;
  maxDepth?: number;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export async function validateNestedP7m({
  bytes,
  callDssApi = defaultCallDssApi,
  config,
  extractCmsSignedContent = defaultExtractCmsSignedContent,
  fileName,
  maxDepth = 5,
}: ValidateNestedP7mInput): Promise<ValidationResponse> {
  const signatures: ValidationResponse["signatures"] = [];
  let currentBytes = bytes;

  for (let level = 0; level < maxDepth; level += 1) {
    const report = await callDssApi(config, toBase64(currentBytes), fileName);
    const mapped = mapDssResponse(report, fileName, "p7m");
    signatures.push(...mapped.signatures);

    const extracted = extractCmsSignedContent(currentBytes);
    if (!extracted) {
      break;
    }

    if (mapped.signatures.length === 0) {
      break;
    }

    currentBytes = extracted;
  }

  return {
    fileName,
    fileType: "p7m",
    signatures,
    totalSignatures: signatures.length,
    validSignatures: signatures.filter(
      (signature) => signature.indication === "TOTAL_PASSED",
    ).length,
  };
}
```

- [ ] **Step 4: Run the nested test to verify GREEN**

Run:

```bash
cd apps/sm-signature-fn
yarn test --runTestsByPath __tests__/nestedP7m.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit nested validator**

Run:

```bash
git add apps/sm-signature-fn/signature/nestedP7m.ts \
  apps/sm-signature-fn/__tests__/nestedP7m.test.ts
git commit -m "feat(signature-fn): validate nested p7m levels"
```

## Task 4: Wire nested validation into the HTTP handler

**Files:**
- Modify: `apps/sm-signature-fn/signature/handler.ts`
- Modify: `apps/sm-signature-fn/signature/validation.ts` if helper reuse is needed
- Test: existing suites plus manual local verification

- [ ] **Step 1: Write failing handler-level test**

If handler tests do not exist, add a focused unit test to `apps/sm-signature-fn/__tests__/handler.test.ts` that mocks `validateNestedP7m` and verifies `.p7m` requests use it while `.pdf` requests keep direct DSS validation.

Use this minimal test shape:

```ts
jest.mock("../signature/nestedP7m", () => ({
  validateNestedP7m: jest.fn().mockResolvedValue({
    fileName: "doc.p7m",
    fileType: "p7m",
    signatures: [],
    totalSignatures: 0,
    validSignatures: 0,
  }),
}));
```

Constructing Azure `HttpRequest` multipart objects is verbose; if the existing test harness does not support it, skip this handler unit and rely on `nestedP7m.test.ts` plus manual HTTP verification in Task 5.

- [ ] **Step 2: Update handler implementation**

Modify `apps/sm-signature-fn/signature/handler.ts`:

```ts
import { validateNestedP7m } from "./nestedP7m";
```

Replace the current validation block:

```ts
const bytesBase64 = await fileToBase64(file);
const report = await callDssApi(config, bytesBase64, file.name);
const result = mapDssResponse(report, file.name, validation.fileType);
return { status: 200, jsonBody: result };
```

with:

```ts
if (validation.fileType === "p7m") {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const result = await validateNestedP7m({
    bytes,
    config,
    fileName: file.name,
  });
  return { status: 200, jsonBody: result };
}

const bytesBase64 = await fileToBase64(file);
const report = await callDssApi(config, bytesBase64, file.name);
const result = mapDssResponse(report, file.name, validation.fileType);
return { status: 200, jsonBody: result };
```

- [ ] **Step 3: Run all Function tests**

Run:

```bash
cd apps/sm-signature-fn
yarn test
```

Expected: all suites PASS.

- [ ] **Step 4: Run type-check/build**

Run:

```bash
cd apps/sm-signature-fn
yarn check-types
yarn build
```

Expected: both commands exit 0.

- [ ] **Step 5: Commit handler wiring**

Run:

```bash
git add apps/sm-signature-fn/signature/handler.ts \
  apps/sm-signature-fn/__tests__/handler.test.ts
git commit -m "feat(signature-fn): use nested validation for p7m files"
```

If `handler.test.ts` was not added, omit it from `git add`.

## Task 5: Verify with the real nested P7M file

**Files:**
- No committed files.
- Use local file: `/Users/lorenzo.franceschini/Downloads/Accordo SEND trilaterale Lugo.pdf.p7m.p7m (2).p7m`

- [ ] **Step 1: Build the Function**

Run:

```bash
cd apps/sm-signature-fn
yarn build
```

Expected: exit 0.

- [ ] **Step 2: Run local verification script**

Run:

```bash
cd apps/sm-signature-fn
node - <<'NODE'
const fs = require('fs');
const path = require('path');
const { validateNestedP7m } = require('./dist/signature/nestedP7m.js');

(async () => {
  const filePath = '/Users/lorenzo.franceschini/Downloads/Accordo SEND trilaterale Lugo.pdf.p7m.p7m (2).p7m';
  const fileName = path.basename(filePath);
  const result = await validateNestedP7m({
    bytes: fs.readFileSync(filePath),
    config: {
      dssApiBaseUrl: 'http://dss-api-dem.northeurope.azurecontainer.io:8080',
      maxFileSizeBytes: 10 * 1024 * 1024,
    },
    fileName,
  });

  console.log(JSON.stringify({
    totalSignatures: result.totalSignatures,
    validSignatures: result.validSignatures,
    signers: result.signatures.map((signature) => signature.signerName),
  }, null, 2));
})();
NODE
```

Expected output:

```json
{
  "totalSignatures": 3,
  "validSignatures": 3,
  "signers": [
    "LORENZO FREDIANELLI",
    "VIONI RICCARDO",
    "Stefania Zammarchi"
  ]
}
```

- [ ] **Step 3: Run final tests**

Run:

```bash
cd apps/sm-signature-fn
yarn test
yarn check-types
yarn build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit verification docs if needed**

Do not commit the real `.p7m` file. If the README needs clarification, update `apps/sm-signature-fn/README.md` with:

```md
- `.p7m` files with nested CMS envelopes are validated recursively. The response aggregates signatures from the outermost envelope to the innermost envelope.
```

Then commit:

```bash
git add apps/sm-signature-fn/README.md
git commit -m "docs(signature-fn): document nested p7m validation"
```

## Self-review checklist

- Spec coverage: covers nested `.p7m` extraction, DSS validation per level, merged response, no frontend contract change, and real-file verification.
- Placeholder scan: no `TBD`, no undefined future work, no vague test instructions.
- Type consistency: `validateNestedP7m`, `extractCmsSignedContent`, `DssSignatureOrTimestampOrEvidenceRecord`, and `ValidationResponse` signatures are consistent across tasks.

