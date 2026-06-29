import * as asn1js from "asn1js";
import { ContentInfo, SignedData } from "pkijs";

function extractOctetStringValue(octetString: asn1js.OctetString): Uint8Array {
  if (!octetString.valueBlock.isConstructed) {
    return new Uint8Array(octetString.valueBlock.valueHex);
  }

  const chunks = octetString.valueBlock.value.map((chunk) => {
    if (!(chunk instanceof asn1js.OctetString)) {
      throw new Error("Constructed OCTET STRING contains non-OCTET STRING chunk");
    }

    return extractOctetStringValue(chunk);
  });
  const totalLength = chunks.reduce((length, chunk) => length + chunk.byteLength, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return output;
}

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

    return extractOctetStringValue(eContent);
  } catch {
    return null;
  }
}
