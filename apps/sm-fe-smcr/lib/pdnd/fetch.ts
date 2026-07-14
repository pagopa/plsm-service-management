import type { PdndConfig } from "./config";
import { getPdndConfig } from "./config";
import { createDpopProof } from "./dpop";
import { getPdndVoucher } from "./token";

type PdndFetchOptions = {
  readonly config?: PdndConfig;
  readonly fetchImpl?: typeof fetch;
  readonly nowSeconds?: number;
};

function toPdndUrl(input: string | URL, apiBaseUrl: string): URL {
  if (input instanceof URL) {
    return input;
  }

  return new URL(
    input,
    apiBaseUrl.endsWith("/") ? apiBaseUrl : `${apiBaseUrl}/`,
  );
}

export async function pdndFetch(
  input: string | URL,
  init: RequestInit = {},
  options: PdndFetchOptions = {},
): Promise<Response> {
  const config = options.config ?? getPdndConfig();
  const fetchImpl = options.fetchImpl ?? fetch;
  const method = (init.method ?? "GET").toUpperCase();
  const url = toPdndUrl(input, config.apiBaseUrl);
  const voucher = await getPdndVoucher({
    config,
    fetchImpl,
    nowSeconds: options.nowSeconds,
  });
  const dpopProof = createDpopProof({
    method,
    url: url.toString(),
    privateKey: config.dpopPrivateKey,
    accessToken: voucher.accessToken,
    nowSeconds: options.nowSeconds,
  });
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${voucher.accessToken}`);
  headers.set("DPoP", dpopProof);

  return fetchImpl(url, {
    ...init,
    method,
    headers,
    signal: init.signal ?? AbortSignal.timeout(config.requestTimeoutMs),
  });
}
