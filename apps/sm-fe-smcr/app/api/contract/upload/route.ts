import { serverEnv } from "@/config/env";
import { logServerError } from "@/lib/logger/logger.server.helpers";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CONTRACT_SIZE_BYTES = 10 * 1024 * 1024; //10MB 
const ALLOWED_MIME_TYPES = ["application/pdf"];

export async function PUT(request: Request) {


  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId");

  // Validazione institutionId (regex UUID)
  
   if (!institutionId) {
    return jsonResponse(
      { error: "Missing required query parameters" },
      400,
    );
  }

  if (!UUID_REGEX.test(institutionId)) {
    return jsonResponse(
      { error: "Invalid institutionId format" },
      400,
    );
  }

  // Validazione file

  const requestFormData = await request.formData();
  const contract = requestFormData.get("contract");

  if (!(contract instanceof File) || contract.size === 0) {
    return jsonResponse(
      { error: "Missing contract file" },
      400,
    );
  }

  if (contract.size > MAX_CONTRACT_SIZE_BYTES) {
    return jsonResponse(
      { error: "Il contratto supera la dimensione massima" },
      400,
    );
  }

  if (!ALLOWED_MIME_TYPES.includes(contract.type)) {
    return jsonResponse(
      { error: "Tipo file non supportato" },
      415
    );
  }  
 

  const apiUrl = `https://api.selfcare.pagopa.it/external/internal/v1/onboarding/${institutionId}/upload-contract-signed`;

  try {
      const externalFormData = new FormData();
      externalFormData.append("contract", contract);
      const apiRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Ocp-Apim-Subscription-Key": serverEnv.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY!,
      },
      body : externalFormData
    });

    if (!apiRes.ok) {
      return await errorHanler(apiRes);
    }

    return new Response(
      apiRes.body,
      {
        status: apiRes.status,
        headers: {"content-type": apiRes.headers.get("content-type") ?? "application/json",},
      },
    );


  } catch (err) {
    logServerError(err, "Errore upload file");
    return new Response(
      JSON.stringify({
        error: "Errore interno nel proxy",
      }),
      {
        status: 500,
      },
    );
  }


  async function errorHanler(apiRes: Response) {
    let details: unknown;

    const contentType = apiRes.headers.get("content-type");

    try {
      if (contentType?.includes("application/json")) {
        details = await apiRes.json();
      } else {
        details = await apiRes.text();
      }
    } catch {
      details = "Impossibile leggere il body della risposta";
    }

    return jsonResponse(
      {
        error: "Errore dal server esterno",
        status: apiRes.status,
        details,
      },
      apiRes.status
    );
  }
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}