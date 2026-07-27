import { NextRequest } from "next/server";
import { GET } from "../route";

describe("GET /api/auth/logout", () => {
  beforeEach(() => {
    process.env.AUTH_FUNCTION_BASE_URL =
      "https://plsm-p-itn-auth-func-01.azurewebsites.net";
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(null));
  });

  afterEach(() => {
    delete process.env.AUTH_FUNCTION_BASE_URL;
    jest.restoreAllMocks();
  });

  it("redirects to the public App Service origin instead of the internal container host", async () => {
    const request = new NextRequest(
      "https://eca33f6936bd:8080/api/auth/logout",
      {
        headers: {
          "disguised-host": "smcr.pagopa.it",
          "x-forwarded-proto": "https",
        },
      },
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://smcr.pagopa.it/");
  });
});
