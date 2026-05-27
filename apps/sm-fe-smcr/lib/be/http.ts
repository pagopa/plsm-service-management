export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleExternalApiError(apiRes: Response) {
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