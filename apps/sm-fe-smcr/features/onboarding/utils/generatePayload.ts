import { Gsp, GspProdPa, Payload } from "../types/payloadTypes";
import { OnboardingSchema } from "../types/onboardingSchema";

export function generatePayload(formData: OnboardingSchema): Payload {
  const geographicTaxonomies =
    formData.institutionType === "PSP"
      ? [
          {
            code: formData.code,
            desc: formData.desc,
          },
        ]
      : [];
  const data = {
    billingData: {
      businessName: formData.businessName,
      digitalAddress: formData.digitalAddress,
      recipientCode: formData.recipientCode ?? "",
      registeredOffice: formData.registeredOffice,
      taxcode: formData.taxcode,
      vatNumber: formData.vatNumber ?? "",
      zipCode: formData.zipCode,
      istatCode: formData.istatCode,
    },
    origin: formData.origin,
    originId: formData.originId,
    users: formData.users,
    assistanceContacts: {
      supportEmail: formData.supportEmail,
    },
    taxCode: formData.taxcode,
    productId: formData.productId,
    geographicTaxonomies,
    institutionLocationData: {
      city: formData.city,
      county: formData.county,
      country: formData.country,
    },
  };
  const commonData =
    formData.subunit === "AOO" || formData.subunit === "UO"
      ? {
          ...data,
          subunitCode: formData.subunitCode,
          subunitType: formData.subunitType,
        }
      : data;
  switch (formData.institutionType) {
    case "PSP": {
      const pspData = {
        ...commonData,
        institutionType: "PSP" as const,
        pspData: {
          abiCode: formData.abiCode ?? "",
          businessRegisterNumber: formData.businessRegisterNumber ?? "",
          dpoData: {
            address: formData.address ?? "",
            pec: formData.pec ?? "",
            email: formData.email ?? "",
          },
          legalRegisterNumber: formData.legalRegisterNumber ?? "",
          legalRegisterName: formData.legalRegisterName ?? "",
          vatNumberGroup: formData.vatNumberGroup ?? false,
        },
      };
      return pspData;
    }

    case "PA": {
      const paData = {
        ...commonData,
        institutionType: "PA" as const,
      };
      return paData;
    }
    case "PT": {
      const ptData = {
        ...commonData,
        institutionType: "PT" as const,
      };
      return ptData;
    }
    case "PRV": {
      const prvData = {
        ...commonData,
        institutionType: "PRV" as const,
      };
      return prvData;
    }
    case "GPU": {
      const gpuData = {
        ...commonData,
        institutionType: "GPU" as const,
      };
      return gpuData;
    }
    case "SA": {
      const saData = {
        ...commonData,
        institutionType: "SA" as const,
      };
      return saData;
    }
    case "AS": {
      const asData = {
        ...commonData,
        institutionType: "AS" as const,
      };
      return asData;
    }
    case "GSP": {
      const gsp = {
        ...commonData,
        companyInformations: {
          rea: formData.rea ?? "",
        },
        institutionType: "GSP" as const,
      };

      if (formData.productId === "prod-pagopa") {
        return {
          ...gsp,
          additionalInformations: {
            belongRegulatedMarket: formData.belongRegulatedMarket ?? false,
            regulatedMarketNote: formData.regulatedMarketNote ?? "",
            ipa: formData.ipa ?? false,
            ipaCode: formData.ipaCode ?? "",
            establishedByRegulatoryProvision:
              formData.establishedByRegulatoryProvision ?? false,
            establishedByRegulatoryProvisionNote:
              formData.establishedByRegulatoryProvisionNote ?? "",
            agentOfPublicService: formData.agentOfPublicService ?? false,
            agentOfPublicServiceNote: formData.agentOfPublicServiceNote ?? "",
            otherNote: formData.otherNote ?? "",
          },
        } satisfies GspProdPa;
      } else {
        return gsp satisfies Gsp;
      }
    }
    case "SCP":
      return {
        ...commonData,
        institutionType: "GSP",
      };
    default:
      throw Error(
        `Invalid institutionType: ${formData.institutionType satisfies never}`,
      );
  }
}
