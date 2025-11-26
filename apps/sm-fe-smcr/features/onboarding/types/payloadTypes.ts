type BillingData = {
  businessName: string;
  digitalAddress: string;
  recipientCode: string;
  registeredOffice: string;
  taxcode: string;
  vatNumber: string;
  zipCode: string;
};
type InstitutionLocationData = {
  city: string;
  county: string;
  country: string;
};

type User = {
  name: string;
  surname: string;
  email: string;
  taxCode: string;
  role: "MANAGER" | "OPERATOR" | "DELEGATE" | "SUB-DELEGATE";
};

type Users = Array<User>;

type AssistanceContacts = {
  supportEmail?: string;
};

type Origin = "IPA" | "SELC" | "INFOCAMERE" | "PDND_INFOCAMERE" | "IVASS";

type ProductId = string;

type TaxCode = string;
type DpoData = {
  address: string;
  pec: string;
  email: string;
};
type PspData = {
  abiCode: string;
  businessRegisterNumber: string;
  dpoData: DpoData;
  legalRegisterNumber: string;
  legalRegisterName: string;
  vatNumberGroup: boolean;
};

type GeographicTaxonomies = Array<{
  code?: string;
  desc?: string;
}>;

type AdditionalInformations = {
  belongRegulatedMarket: boolean;
  regulatedMarketNote: string;
  ipa: boolean;
  ipaCode: string;
  establishedByRegulatoryProvision: boolean;
  establishedByRegulatoryProvisionNote: string;
  agentOfPublicService: boolean;
  agentOfPublicServiceNote: string;
  otherNote: string;
};

type CompanyInformations = {
  rea: string;
};

export type Common = {
  billingData: BillingData;
  users: Users;
  origin: Origin;
  productId: ProductId;
  taxCode: TaxCode;
  assistanceContacts: AssistanceContacts;
  geographicTaxonomies: GeographicTaxonomies;
  institutionLocationData: InstitutionLocationData;
};

export type Psp = Common & {
  institutionType: "PSP";
  originId?: string;
  pspData: PspData;
};

export type Pa = Common & {
  institutionType: "PA";
  originId?: string;
};

export type Pt = Common & {
  institutionType: "PT";
  originId?: string;
};

export type GspProdPa = Common & {
  institutionType: "GSP";
  originId?: string;
  additionalInformations: AdditionalInformations;
  companyInformations: CompanyInformations;
};

export type Gsp = Common & {
  institutionType: "GSP";
  originId?: string;
};

export type Scp = Common & {
  institutionType: "SCP";
  originId?: string;
};
export type Prv = Common & {
  institutionType: "PRV";
  originId?: string;
};

export type Gpu = Common & {
  institutionType: "GPU";
  originId?: string;
};

export type Sa = Common & {
  institutionType: "SA";
  originId?: string;
};

export type As = Common & {
  institutionType: "AS";
  originId?: string;
};

export type Payload =
  | Psp
  | Pa
  | Pt
  | GspProdPa
  | Gsp
  | Scp
  | Prv
  | Gpu
  | Sa
  | As;
