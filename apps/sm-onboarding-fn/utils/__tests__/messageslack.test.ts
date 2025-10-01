import { isRight } from "fp-ts/lib/Either";
import { DecodedContract } from "../messageslack";

describe("Test decoder", () => {
  it("should be validate a valid item", () => {
    const inputData = {
      createdAt: "2024-05-01T00:00:00Z",
      updatedAt: "2024-05-01T00:00:00Z",
      institution: {
        institutionType: "PA",
        description: "test",
        origin: "origin",
        originId: "originId",
        taxCode: "taxCode"
      },
      internalIstitutionID: "internalIstitutionID",
      notificationType: "ADD",
      product: "prod-io-premium"
    };
    const res = DecodedContract.decode(inputData);
    expect(isRight(res)).toBe(true);
  });
  it("should be validate an item with pricing plan", () => {
    const inputData = {
      createdAt: "2024-05-01T00:00:00Z",
      updatedAt: "2024-05-01T00:00:00Z",
      institution: {
        institutionType: "PA",
        description: "test",
        origin: "origin",
        originId: "originId",
        taxCode: "taxCode"
      },
      internalIstitutionID: "internalIstitutionID",
      notificationType: "ADD",
      product: "prod-io-premium",
      pricingPlan: "FA"
    };
    const res = DecodedContract.decode(inputData);
    expect(isRight(res)).toBe(true);
  });
  it("should not be validate an unknown product id", () => {
    const inputData = {
      institution: {
        description: "test"
      },
      product: "prod-io-standard"
    };
    const res = DecodedContract.decode(inputData);
    expect(isRight(res)).toBe(false);
  });
  it("should validate an empty Recipient code", () => {
    const inputData = {
      id: "00000-00000-00000-00000-0000000000000",
      internalIstitutionID: "00000-00000-00000-00000-0000000000000",
      institutionId: "00000-00000-00000-00000-0000000000000",
      product: "prod-pagopa",
      state: "ACTIVE",
      filePath:
        "parties/docs/psp/BANCA_TEST/00000_BANCA_TEST.pdf",
      fileName: "00000_BANCA_TEST.pdf",
      contentType: "application/pdf",
      onboardingTokenId: "00000-00000-00000-00000-0000000000000",
      institution: {
        institutionType: "PSP",
        description: "Banca Test S.p.A",
        digitalAddress: "email@postacert.test.it",
        address: "Piazza Test, 00",
        taxCode: "00000000000",
        origin: "SELC",
        originId: "00000000000",
        zipCode: "00000",
        paymentServiceProvider: {
          businessRegisterNumber: "00000000000",
          legalRegisterNumber: "",
          legalRegisterName: "",
          longTermPayments: false,
          abiCode: "00000",
          vatNumberGroup: false,
          providerNames: ["TESTXXMM", "ABIXXXXX"],
          contractType: "A",
          contractId: "pagopa-psp-xxx"
        },
        istatCode: "00000",
        city: "TEST",
        country: "IT",
        county: "TE"
      },
      billing: {
        vatNumber: "00000000000",
        recipientCode: "",
        publicServices: false
      },
      createdAt: "2023-11-15T13:25:55.318Z",
      updatedAt: "2025-03-14T12:41:01.761Z",
      notificationType: "UPDATE",
      isAggregator: false
    };
    const res = DecodedContract.decode(inputData);
    console.log(JSON.stringify(res, null, 2));
    expect(isRight(res)).toBe(true);
  });
});
