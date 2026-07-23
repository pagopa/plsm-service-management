import { createClientAssertion } from "./client-assertion";
import type { PdndConfig } from "./config";
import { getPdndConfig } from "./config";
import { createDpopProof } from "./dpop";

export type PdndVoucher = {
  readonly accessToken: string;
  readonly expiresAt: number;
  readonly tokenType: "DPoP";
};

type PdndTokenResponse = {
  readonly access_token?: unknown;
  readonly expires_in?: unknown;
  readonly token_type?: unknown;
};

type GetPdndVoucherOptions = {
  readonly config?: PdndConfig;
  readonly fetchImpl?: typeof fetch;
  readonly nowSeconds?: number;
};

type CachedVoucher = {
  readonly cacheKey: string;
  readonly voucher: PdndVoucher;
};

let cachedVoucher: CachedVoucher | undefined;

function getCacheKey(config: PdndConfig): string {
  return `${config.environment}:${config.clientId}:${config.authTokenUrl}`;
}

function isTokenResponse(value: PdndTokenResponse): value is {
  readonly access_token: string;
  readonly expires_in: number;
  readonly token_type: "DPoP";
} {
  return (
    typeof value.access_token === "string" &&
    typeof value.expires_in === "number" &&
    value.expires_in > 0 &&
    value.token_type === "DPoP"
  );
}

async function readResponseBody(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export function clearPdndVoucherCache(): void {
  cachedVoucher = undefined;
}

export async function requestPdndVoucher(
  config: PdndConfig,
  fetchImpl: typeof fetch = fetch,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<PdndVoucher> {
  const clientAssertion = createClientAssertion(config, { nowSeconds });
  const dpopProof = createDpopProof({
    method: "POST",
    url: config.authTokenUrl,
    privateKey: config.dpopPrivateKey,
    nowSeconds,
  });
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_assertion: clientAssertion,
    client_assertion_type:
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
    grant_type: "client_credentials",
  });

  const response = await fetchImpl(config.authTokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      DPoP: dpopProof,
    },
    body,
    signal: AbortSignal.timeout(config.requestTimeoutMs),
  });

  if (!response.ok) {
    const responseBody = await readResponseBody(response);
    throw new Error(
      `PDND token request failed with status ${response.status}${
        responseBody ? `: ${responseBody}` : ""
      }`,
    );
  }

  const tokenResponse = (await response.json()) as PdndTokenResponse;
  if (!isTokenResponse(tokenResponse)) {
    throw new Error("PDND token response is invalid or token_type is not DPoP");
  }

  return {
    accessToken: tokenResponse.access_token,
    expiresAt: nowSeconds + tokenResponse.expires_in,
    tokenType: tokenResponse.token_type,
  };
}

export async function getPdndVoucher(
  options: GetPdndVoucherOptions = {},
): Promise<PdndVoucher> {
  const config = options.config ?? getPdndConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const cacheKey = getCacheKey(config);

  if (
    cachedVoucher?.cacheKey === cacheKey &&
    cachedVoucher.voucher.expiresAt - config.tokenRefreshMarginSeconds >
      nowSeconds
  ) {
    return cachedVoucher.voucher;
  }

  const voucher = await requestPdndVoucher(config, fetchImpl, nowSeconds);
  cachedVoucher = { cacheKey, voucher };
  return voucher;
}
