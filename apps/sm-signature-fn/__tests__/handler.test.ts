import type {
  HttpRequest,
  InvocationContext,
} from "@azure/functions";
import { validateSignature } from "../signature/handler";
import { callDssApi, mapDssResponse } from "../signature/dss";
import { validateNestedP7m } from "../signature/nestedP7m";

jest.mock("../signature/dss", () => ({
  callDssApi: jest.fn(),
  DssApiError: class DssApiError extends Error {
    constructor(
      message: string,
      public readonly status: number,
    ) {
      super(message);
      this.name = "DssApiError";
    }
  },
  mapDssResponse: jest.fn(),
}));

jest.mock("../signature/nestedP7m", () => ({
  validateNestedP7m: jest.fn().mockResolvedValue({
    fileName: "doc.p7m",
    fileType: "p7m",
    signatures: [],
    totalSignatures: 0,
    validSignatures: 0,
  }),
}));

const config = {
  dssApiBaseUrl: "http://dss.example",
  maxFileSizeBytes: 10 * 1024 * 1024,
};

function makeRequest(file: File): HttpRequest {
  const formData = new FormData();
  formData.set("file", file);
  return {
    formData: jest.fn().mockResolvedValue(formData),
  } as unknown as HttpRequest;
}

function makeContext(): InvocationContext {
  return {
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  } as unknown as InvocationContext;
}

describe("validateSignature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DSS_API_BASE_URL = config.dssApiBaseUrl;
    process.env.MAX_FILE_SIZE_BYTES = String(config.maxFileSizeBytes);
    (callDssApi as jest.Mock).mockResolvedValue({ SimpleReport: {} });
    (mapDssResponse as jest.Mock).mockReturnValue({
      fileName: "doc.pdf",
      fileType: "pdf",
      signatures: [],
      totalSignatures: 0,
      validSignatures: 0,
    });
  });

  it("uses nested validation for p7m files", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "doc.p7m", {
      type: "application/pkcs7-mime",
    });

    const response = await validateSignature(makeRequest(file), makeContext());

    expect(validateNestedP7m).toHaveBeenCalledWith({
      bytes: new Uint8Array([1, 2, 3]),
      config,
      fileName: "doc.p7m",
    });
    expect(callDssApi).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.jsonBody).toEqual({
      fileName: "doc.p7m",
      fileType: "p7m",
      signatures: [],
      totalSignatures: 0,
      validSignatures: 0,
    });
  });

  it("keeps direct DSS validation for pdf files", async () => {
    const file = new File([new Uint8Array([4, 5, 6])], "doc.pdf", {
      type: "application/pdf",
    });

    await validateSignature(makeRequest(file), makeContext());

    expect(validateNestedP7m).not.toHaveBeenCalled();
    expect(callDssApi).toHaveBeenCalledWith(config, "BAUG", "doc.pdf");
    expect(mapDssResponse).toHaveBeenCalledWith(
      { SimpleReport: {} },
      "doc.pdf",
      "pdf",
    );
  });
});
