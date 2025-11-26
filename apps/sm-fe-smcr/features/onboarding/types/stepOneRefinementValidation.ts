import { z } from "zod";
import {
  AOO_CODE_LENGTH,
  TAXCODE_BUSINESS_LENGTH,
  UO_CODE_LENGTH,
} from "../utils/constants";

export const stepOneRefinementValidation = (
  data: any,
  ctx: z.RefinementCtx,
) => {
  if (
    data.subunit === "Apicale" &&
    data.taxcode.length !== TAXCODE_BUSINESS_LENGTH
  ) {
    ctx.addIssue({
      code: "custom",
      message: `Il campo codice fiscale deve essere di ${TAXCODE_BUSINESS_LENGTH} caratteri`,
      path: ["taxcode"],
    });
  }
  if (!data.isPIVANull && data.vatNumber.length !== TAXCODE_BUSINESS_LENGTH) {
    ctx.addIssue({
      code: "custom",
      message: `Il campo Partita Iva deve essere di ${TAXCODE_BUSINESS_LENGTH} caratteri`,
      path: ["vatNumber"],
    });
  }
  if (!data.productId) {
    ctx.addIssue({
      code: "custom",
      message: "Il campo Prodotto è obbligatorio",
      path: ["productId"],
    });
  }
  if (data.institutionType === "PSP") {
    if (!data.abiCode) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Codice ABI è obbligatorio",
        path: ["abiCode"],
      });
    }
    if (!data.businessRegisterNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Business Register Number è obbligatorio",
        path: ["businessRegisterNumber"],
      });
    }
    if (!data.address) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Address è obbligatorio",
        path: ["address"],
      });
    }
    if (!data.pec) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo PEC è obbligatorio",
        path: ["pec"],
      });
    }
    if (!data.email) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Email è obbligatorio",
        path: ["email"],
      });
    }
    if (!data.legalRegisterNumber) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Legal Register Number è obbligatorio",
        path: ["legalRegisterNumber"],
      });
    }
    if (!data.legalRegisterName) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Legal Register Name è obbligatorio",
        path: ["legalRegisterName"],
      });
    }
    if (!data.code) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Code è obbligatorio",
        path: ["code"],
      });
    }
    if (!data.desc) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo Desc è obbligatorio",
        path: ["desc"],
      });
    }
  }
  if (
    data.productId !== "prod-interop" &&
    (data.recipientCode.length < 6 || data.recipientCode.length > 7)
  ) {
    ctx.addIssue({
      code: "custom",
      message:
        "Il campo Codice SDI deve essere di minimo 6 e massimo 7 caratteri se il prodotto non è prod-interop",
      path: ["recipientCode"],
    });
  }
  if (data.institutionType === "GSP" && data.productId === "prod-pagopa") {
    if (!data.rea) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo REA è obbligatorio",
        path: ["rea"],
      });
    }
  }
  if (data.subunit === "AOO") {
    if (data.subunitCode?.length !== AOO_CODE_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Il campo univoco di una AOO deve avere ${AOO_CODE_LENGTH} caratteri`,
        path: ["subunitCode"],
      });
    }
    if (!data.subunitType) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo subunitType é obbligatorio",
        path: ["subunitType"],
      });
    }
  }
  if (data.subunit === "UO") {
    if (data.subunitCode?.length !== UO_CODE_LENGTH) {
      ctx.addIssue({
        code: "custom",
        message: `Il codice univoco di una UO deve avere ${UO_CODE_LENGTH} caratteri`,
        path: ["subunitCode"],
      });
    }
    if (!data.subunitType) {
      ctx.addIssue({
        code: "custom",
        message: "Il campo subunitType é obbligatorio",
        path: ["subunitType"],
      });
    }
  }
  if (data.productId === "prod-io-sign" && !data.supportEmail) {
    ctx.addIssue({
      code: "custom",
      message: "Il campo Email di supporto è obbligatorio per Firma con IO",
      path: ["supportEmail"],
    });
  }
};
