import { OnboardingSchema } from "../types/onboardingSchema";
import { StepOneSchema } from "../types/stepOneSchema";
import { StepTwoSchema } from "../types/stepTwoSchema";

export function getStepOneData(data: OnboardingSchema): StepOneSchema {
  return {
    institutionType: data.institutionType,
    subunit: data.subunit,
    subunitCode: data.subunitCode,
    subunitType: data.subunitType,
    businessName: data.businessName,
    digitalAddress: data.digitalAddress,
    recipientCode: data.recipientCode,
    registeredOffice: data.registeredOffice,
    taxcode: data.taxcode,
    vatNumber: data.vatNumber,
    city: data.city,
    county: data.county,
    country: data.country,
    origin: data.origin,
    originId: data.originId,
    productId: data.productId,
    zipCode: data.zipCode,
    supportEmail: data.supportEmail,
    id: data.id,
    externalId: data.externalId,
    code: data.code,
    desc: data.desc,
    abiCode: data.abiCode,
    businessRegisterNumber: data.businessRegisterNumber,
    address: data.address,
    pec: data.pec,
    email: data.email,
    legalRegisterNumber: data.legalRegisterNumber,
    legalRegisterName: data.legalRegisterName,
    vatNumberGroup: data.vatNumberGroup,
    belongRegulatedMarket: data.belongRegulatedMarket,
    regulatedMarketNote: data.regulatedMarketNote,
    ipa: data.ipa,
    ipaCode: data.ipaCode,
    establishedByRegulatoryProvision: data.establishedByRegulatoryProvision,
    establishedByRegulatoryProvisionNote:
      data.establishedByRegulatoryProvisionNote,
    agentOfPublicService: data.agentOfPublicService,
    agentOfPublicServiceNote: data.agentOfPublicServiceNote,
    otherNote: data.otherNote,
    rea: data.rea,
    isPIVANull: data.isPIVANull,
    isPIVAequalToTaxcode: data.isPIVAequalToTaxcode,
    istatCode: data.istatCode,
  };
}
export function getStepTwoData(data: OnboardingSchema): StepTwoSchema {
  return {
    users: data.users,
  };
}
