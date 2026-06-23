import * as asn1js from "asn1js";
import { ContentInfo, SignedData } from "pkijs";

export function extractCmsSignedContent(input: Uint8Array): Uint8Array | null {
  const arrayBuffer = new ArrayBuffer(input.byteLength);
  new Uint8Array(arrayBuffer).set(input);
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
