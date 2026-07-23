import { randomUUID } from "crypto";
import { publicJwkFromPrivateKey, sha256Base64Url, signJwt } from "./crypto";

type CreateDpopProofOptions = {
  readonly method: string;
  readonly url: string;
  readonly privateKey: string;
  readonly accessToken?: string;
  readonly nowSeconds?: number;
  readonly jwtId?: string;
};

export function toDpopHtu(url: string): string {
  const parsedUrl = new URL(url);
  parsedUrl.search = "";
  parsedUrl.hash = "";
  return parsedUrl.toString();
}

export function createDpopProof(options: CreateDpopProofOptions): string {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    htm: options.method.toUpperCase(),
    htu: toDpopHtu(options.url),
    iat: nowSeconds,
    jti: options.jwtId ?? randomUUID(),
  };

  if (options.accessToken) {
    payload.ath = sha256Base64Url(options.accessToken);
  }

  return signJwt(
    {
      alg: "RS256",
      typ: "dpop+jwt",
      jwk: publicJwkFromPrivateKey(options.privateKey),
    },
    payload,
    options.privateKey,
  );
}
