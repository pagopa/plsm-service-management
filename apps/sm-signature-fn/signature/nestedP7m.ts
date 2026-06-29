import * as asn1js from "asn1js";
import { ContentInfo, id_ContentType_SignedData } from "pkijs";
import type { AppConfig } from "../utils/checkConfig";
import { extractCmsSignedContent as defaultExtractCmsSignedContent } from "./cms";
import { callDssApi as defaultCallDssApi, mapDssResponse } from "./dss";
import type {
  DssValidationReport,
  ValidationResponse,
} from "./models/signature";

export type ValidateNestedP7mInput = {
  bytes: Uint8Array;
  config: AppConfig;
  fileName: string;
  callDssApi?: (
    config: AppConfig,
    bytesBase64: string,
    fileName: string,
  ) => Promise<DssValidationReport>;
  extractCmsSignedContent?: (input: Uint8Array) => Uint8Array | null;
  maxDepth?: number;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function isLikelyCmsContent(bytes: Uint8Array): boolean {
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  const asn1 = asn1js.fromBER(arrayBuffer);

  if (asn1.offset === -1) {
    return false;
  }

  try {
    const contentInfo = new ContentInfo({ schema: asn1.result });
    return contentInfo.contentType === id_ContentType_SignedData;
  } catch {
    return false;
  }
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
    if (!extracted || !isLikelyCmsContent(extracted)) {
      break;
    }

    if (level === maxDepth - 1) {
      throw new Error(`Nested p7m max depth exceeded: ${maxDepth}`);
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
