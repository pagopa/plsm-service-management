import {
  createHash,
  createPrivateKey,
  createPublicKey,
  createSign,
} from "crypto";

type JwtAlgorithm = "RS256" | "ES256";

type JwtHeader = {
  readonly alg: JwtAlgorithm;
  readonly typ: string;
  readonly kid?: string;
  readonly jwk?: Record<string, unknown>;
};

type JwtPayload = Record<string, unknown>;

export function base64Url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function sha256Base64Url(input: string): string {
  return createHash("sha256").update(input).digest("base64url");
}

export function publicJwkFromPrivateKey(
  privateKeyPem: string,
): Record<string, unknown> {
  return createPublicKey(createPrivateKey(privateKeyPem)).export({
    format: "jwk",
  }) as Record<string, unknown>;
}

export function signJwt(
  header: JwtHeader,
  payload: JwtPayload,
  privateKeyPem: string,
): string {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const privateKey = createPrivateKey(privateKeyPem);
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();

  const signature = signer.sign(
    header.alg === "ES256"
      ? { key: privateKey, dsaEncoding: "ieee-p1363" }
      : privateKey,
  );

  return `${signingInput}.${base64Url(signature)}`;
}
