import { BlobServiceClient, type ContainerClient } from "@azure/storage-blob";
import { Readable } from "node:stream";

export type AzureBlobLatestDownloadParams = {
  connectionString: string;
  /** Nome container oppure URL del container (es. da env `FE_SMCR_AZURE_STORAGE_CONTAINER`). */
  containerNameOrUrl: string;
  /** Prefisso blob (es. env `FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX`). */
  blobPrefix: string;
};

export type AzureBlobLatestDownloadResult = {
  blobName: string;
  buffer: Buffer;
};

export function normalizeAzureStorageConnectionString(
  connectionString: string,
): string {
  let s = connectionString.trim();
  if (/^(https?);/i.test(s) && !/^DefaultEndpointsProtocol=/i.test(s)) {
    const protocol = /^https;/i.test(s) ? "https" : "http";
    s = `DefaultEndpointsProtocol=${protocol};${s.replace(/^https?;/i, "").trim()}`;
  }
  s = s.replace(
    /DefaultEndpointsProtocol\s*=\s*([^;]*)/gi,
    (_match, value: string) => {
      const v = (value ?? "").trim().toLowerCase();
      return v.startsWith("https")
        ? "DefaultEndpointsProtocol=https"
        : "DefaultEndpointsProtocol=http";
    },
  );
  return s;
}

export function resolveAzureStorageContainerName(containerEnv: string): string {
  if (
    !containerEnv.startsWith("https://") &&
    !containerEnv.startsWith("http://")
  ) {
    return containerEnv;
  }
  try {
    const parsed = new URL(containerEnv);
    const hostname = parsed.hostname.toLowerCase();
    const allowedHost =
      hostname === "blob.core.windows.net" ||
      hostname.endsWith(".blob.core.windows.net");
    if (!allowedHost) {
      return containerEnv;
    }
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/")[0];
    return pathname || containerEnv;
  } catch {
    return containerEnv;
  }
}

export function getAzureBlobContainerClient(
  connectionString: string,
  containerNameOrUrl: string,
): ContainerClient {
  const normalized = normalizeAzureStorageConnectionString(connectionString);
  const blobServiceClient = BlobServiceClient.fromConnectionString(normalized);
  const containerName = resolveAzureStorageContainerName(containerNameOrUrl);
  return blobServiceClient.getContainerClient(containerName);
}

export async function getLatestAzureBlobNameByPrefix(
  containerClient: ContainerClient,
  prefix: string,
): Promise<string | null> {
  const blobs: { name: string; lastModified: Date }[] = [];
  for await (const blob of containerClient.listBlobsFlat({ prefix })) {
    const lastModified = blob.properties.lastModified;
    if (lastModified) {
      blobs.push({ name: blob.name, lastModified });
    }
  }
  if (blobs.length === 0) return null;
  blobs.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  const latest = blobs[0];
  return latest ? latest.name : null;
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function downloadAzureBlobAsBuffer(
  containerClient: ContainerClient,
  blobName: string,
): Promise<Buffer> {
  const blobClient = containerClient.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();
  if (!downloadResponse.readableStreamBody) {
    const err = new Error(
      `Blob "${blobName}" has no readable body`,
    ) as Error & {
      blobName: string;
    };
    err.name = "AzureBlobEmptyBody";
    err.blobName = blobName;
    throw err;
  }
  return streamToBuffer(downloadResponse.readableStreamBody as Readable);
}

/**
 * Scarica il blob più recente (per `lastModified`) sotto il prefisso indicato.
 */
export async function downloadLatestAzureBlobByPrefix(
  params: AzureBlobLatestDownloadParams,
): Promise<AzureBlobLatestDownloadResult | null> {
  const { connectionString, containerNameOrUrl, blobPrefix } = params;
  const containerClient = getAzureBlobContainerClient(
    connectionString,
    containerNameOrUrl,
  );
  const latestName = await getLatestAzureBlobNameByPrefix(
    containerClient,
    blobPrefix,
  );
  if (!latestName) return null;
  const buffer = await downloadAzureBlobAsBuffer(containerClient, latestName);
  return { blobName: latestName, buffer };
}
