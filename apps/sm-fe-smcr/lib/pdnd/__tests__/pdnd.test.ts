import { generateKeyPairSync } from "crypto";
import { createClientAssertion } from "../client-assertion";
import type { PdndConfig } from "../config";
import { getPdndConfig } from "../config";
import { createDpopProof } from "../dpop";
import { pdndFetch } from "../fetch";
import { sha256Base64Url } from "../crypto";
import { clearPdndVoucherCache, getPdndVoucher } from "../token";

function exportPrivateKeyPem(
  keyPair: ReturnType<typeof generateKeyPairSync>,
): string {
  return keyPair.privateKey.export({ format: "pem", type: "pkcs8" }).toString();
}

function decodeJwt(token: string): {
  readonly header: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
} {
  const [encodedHeader, encodedPayload] = token.split(".");
  if (!encodedHeader || !encodedPayload) {
    throw new Error("Invalid JWT");
  }

  return {
    header: JSON.parse(Buffer.from(encodedHeader, "base64url").toString()),
    payload: JSON.parse(Buffer.from(encodedPayload, "base64url").toString()),
  };
}

function createTestConfig(): PdndConfig {
  const clientAssertionKeyPair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const dpopKeyPair = generateKeyPairSync("ec", {
    namedCurve: "P-256",
  });

  return {
    environment: "collaudo",
    clientId: "test-client-id",
    clientAssertionKid: "test-kid",
    clientAssertionAudience: "auth-coll.interop.pagopa.it/client-assertion",
    authTokenUrl: "https://auth-coll.interop.pagopa.it/token.oauth2",
    apiBaseUrl: "https://api-coll.interop.pagopa.it",
    clientAssertionPrivateKey: exportPrivateKeyPem(clientAssertionKeyPair),
    dpopPrivateKey: exportPrivateKeyPem(dpopKeyPair),
    clientAssertionTtlSeconds: 600,
    tokenRefreshMarginSeconds: 60,
    requestTimeoutMs: 10_000,
  };
}

function createTokenFetchMock(): jest.MockedFunction<typeof fetch> {
  return jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(
    async () =>
      new Response(
        JSON.stringify({
          access_token: "test-access-token",
          expires_in: 600,
          token_type: "DPoP",
        }),
        {
          headers: { "content-type": "application/json" },
          status: 200,
        },
      ),
  );
}

describe("PDND DPoP client", () => {
  beforeEach(() => {
    clearPdndVoucherCache();
  });

  it("validates required PDND env values lazily", () => {
    expect(() => getPdndConfig({})).toThrow(
      "Missing PDND configuration: PDND_ENV",
    );
  });

  it("creates a client assertion with PDND claims", () => {
    const config = createTestConfig();
    const assertion = createClientAssertion(config, {
      jwtId: "assertion-jti",
      nowSeconds: 1_700_000_000,
    });
    const decoded = decodeJwt(assertion);

    expect(decoded.header).toMatchObject({
      alg: "RS256",
      kid: "test-kid",
      typ: "JWT",
    });
    expect(decoded.payload).toMatchObject({
      iss: "test-client-id",
      sub: "test-client-id",
      aud: "auth-coll.interop.pagopa.it/client-assertion",
      jti: "assertion-jti",
      iat: 1_700_000_000,
      exp: 1_700_000_600,
    });
  });

  it("creates a resource-server DPoP proof with ath and htu without query string", () => {
    const config = createTestConfig();
    const proof = createDpopProof({
      method: "get",
      url: "https://api-coll.interop.pagopa.it/v3/eservices?offset=0&limit=50#x",
      privateKey: config.dpopPrivateKey,
      accessToken: "test-access-token",
      jwtId: "dpop-jti",
      nowSeconds: 1_700_000_000,
    });
    const decoded = decodeJwt(proof);

    expect(decoded.header).toMatchObject({
      alg: "ES256",
      typ: "dpop+jwt",
    });
    expect(decoded.header.jwk).toMatchObject({
      crv: "P-256",
      kty: "EC",
    });
    expect(decoded.payload).toMatchObject({
      htm: "GET",
      htu: "https://api-coll.interop.pagopa.it/v3/eservices",
      iat: 1_700_000_000,
      jti: "dpop-jti",
      ath: sha256Base64Url("test-access-token"),
    });
  });

  it("requests and caches the PDND voucher until the refresh margin", async () => {
    const config = createTestConfig();
    const fetchMock = createTokenFetchMock();

    const firstVoucher = await getPdndVoucher({
      config,
      fetchImpl: fetchMock,
      nowSeconds: 1_700_000_000,
    });
    const secondVoucher = await getPdndVoucher({
      config,
      fetchImpl: fetchMock,
      nowSeconds: 1_700_000_100,
    });

    expect(firstVoucher).toEqual(secondVoucher);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await getPdndVoucher({
      config,
      fetchImpl: fetchMock,
      nowSeconds: 1_700_000_541,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("sends Authorization and per-request DPoP headers in pdndFetch", async () => {
    const config = createTestConfig();
    const fetchMock = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "test-access-token",
            expires_in: 600,
            token_type: "DPoP",
          }),
          { headers: { "content-type": "application/json" }, status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));

    const response = await pdndFetch("/v3/eservices?offset=0", undefined, {
      config,
      fetchImpl: fetchMock,
      nowSeconds: 1_700_000_000,
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const resourceCall = fetchMock.mock.calls[1];
    if (!resourceCall) {
      throw new Error("Missing resource fetch call");
    }
    const [url, init] = resourceCall;
    const headers = new Headers(init?.headers);
    const decodedDpop = decodeJwt(headers.get("DPoP") ?? "");

    expect(url.toString()).toBe(
      "https://api-coll.interop.pagopa.it/v3/eservices?offset=0",
    );
    expect(headers.get("Authorization")).toBe("DPoP test-access-token");
    expect(decodedDpop.payload).toMatchObject({
      htm: "GET",
      htu: "https://api-coll.interop.pagopa.it/v3/eservices",
      ath: sha256Base64Url("test-access-token"),
    });
  });
});
