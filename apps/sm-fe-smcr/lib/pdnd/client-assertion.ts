import { randomUUID } from "crypto";
import type { PdndConfig } from "./config";
import { signJwt } from "./crypto";

type CreateClientAssertionOptions = {
  readonly nowSeconds?: number;
  readonly jwtId?: string;
};

export function createClientAssertion(
  config: PdndConfig,
  options: CreateClientAssertionOptions = {},
): string {
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);

  return signJwt(
    {
      alg: "RS256",
      kid: config.clientAssertionKid,
      typ: "JWT",
    },
    {
      iss: config.clientId,
      sub: config.clientId,
      aud: config.clientAssertionAudience,
      jti: options.jwtId ?? randomUUID(),
      iat: nowSeconds,
      exp: nowSeconds + config.clientAssertionTtlSeconds,
    },
    config.clientAssertionPrivateKey,
  );
}
