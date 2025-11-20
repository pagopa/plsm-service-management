import type { HttpRequest, InvocationContext, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME as string;
const containerName = "fatppublic";
const folderPrefix = "manuali/";
const baseFileName = folderPrefix + "ManualeUtentePortaleFatturazione.pdf";
const baseNameWithoutExtension = baseFileName.replace(".pdf", "");

const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  new DefaultAzureCredential()
);
const containerClient: ContainerClient = blobServiceClient.getContainerClient(containerName);

async function getNextOldVersion(containerClient: ContainerClient, baseName: string): Promise<string> {
  let maxVersion = 0;
  for await (const blob of containerClient.listBlobsFlat({ prefix: folderPrefix + "_old_" + baseName })) {
    const match = blob.name.match(/(\d+\.\d+)(?=\.pdf$)/);
    if (match) {
      const version = parseFloat(match[1]);
      if (version > maxVersion) maxVersion = version;
    }
  }
  const nextVersion = (maxVersion + 0.1).toFixed(1);
  return `${folderPrefix}_old_${baseName} ${nextVersion}.pdf`;
}

export async function httpTrigger(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log.info("Elaborazione richiesta PDF");

  if (!req.body || !req.body.pdfBase64) {
    return {
      status: 400,
      body: "Missing pdfBase64 in request body"
    };
  }

  try {
    const pdfBuffer = Buffer.from(req.body.pdfBase64, "base64");
    const newOldBlobName = await getNextOldVersion(containerClient, baseNameWithoutExtension);

    const currentBlobClient = containerClient.getBlockBlobClient(baseFileName);
    const newOldBlobClient = containerClient.getBlockBlobClient(newOldBlobName);

    if (!(await currentBlobClient.exists())) {
      return {
        status: 404,
        body: `${baseFileName} not found`
      };
    }

    const copyPoller = await newOldBlobClient.beginCopyFromURL(currentBlobClient.url);
    await copyPoller.pollUntilDone();
    await currentBlobClient.delete();
    await currentBlobClient.uploadData(pdfBuffer, {
      blobHTTPHeaders: { blobContentType: "application/pdf" }
    });

    return {
      status: 200,
      body: `File caricato con successo. Vecchio file rinominato in ${newOldBlobName}`
    };
  } catch (error) {
    context.log.error("Errore durante l'elaborazione:", error);
    return {
      status: 500,
      body: "Internal error"
    };
  }
}
