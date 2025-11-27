export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const institutionId = searchParams.get("institutionId");
  const productId = searchParams.get("productId");
  const customFilename = searchParams.get("filename") || "documento";

  // Validate institutionId and productId: allow only alphanumeric, dash, and underscore (adjust as needed)
  const idPattern = /^[a-zA-Z0-9_-]+$/;
  if (!institutionId || !productId) {
    return new Response(
      JSON.stringify({ error: "Missing required query parameters" }),
      { status: 400 },
    );
  }
  if (!idPattern.test(institutionId) || !idPattern.test(productId)) {
    return new Response(
      JSON.stringify({ error: "Invalid institutionId or productId format" }),
      { status: 400 },
    );
  }

  const apiUrl = `https://api.selfcare.pagopa.it/external/support/v1/institutions/${institutionId}/contract?productId=${productId}`;

  try {
    const apiRes = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Ocp-Apim-Subscription-Key": process.env.FE_SMCR_API_KEY_INSTITUTION!,
      },
    });

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({ error: "Errore dal server esterno" }),
        { status: apiRes.status },
      );
    }

    const buffer = await apiRes.arrayBuffer();

    let extension = "";
    const originalDisposition = apiRes.headers.get("content-disposition");
    if (originalDisposition) {
      const filenameMatch = originalDisposition.match(/filename="?([^"]+)"?/i);
      if (filenameMatch && filenameMatch[1]) {
        const origFilename = filenameMatch[1];
        const firstDot = origFilename.indexOf(".");
        if (firstDot !== -1) {
          extension = origFilename.slice(firstDot);
        }
      }
    }
    if (!extension) extension = ".pdf";

    const asciiName = `${customFilename}${extension}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const utf8Name = encodeURIComponent(`${customFilename}${extension}`);

    const newDisposition = `attachment; filename="${asciiName}"; filename*=UTF-8''${utf8Name}`;

    const headers = new Headers();
    const contentType = apiRes.headers.get("content-type");
    if (contentType) headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", newDisposition);
    headers.set("Content-Length", buffer.byteLength.toString());

    return new Response(buffer, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Errore interno nel proxy", err);
    return new Response(JSON.stringify({ error: "Errore interno nel proxy" }), {
      status: 500,
    });
  }
}
