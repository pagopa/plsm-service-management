import { ProductOptions } from "../types/productType";
import { RoleOptions } from "../types/roleType";

export const outputOptions = ["clipboard", "uat", "prod"] as const;
export type OutputOption = (typeof outputOptions)[number];

export const institutionValues = [
  "PSP",
  "PA",
  "GSP",
  "PT",
  "SCP",
  "PRV",
  "GPU",
  "SA",
  "AS",
] as const;

const institutionKeys = [
  "psp",
  "pa",
  "gsp",
  "pt",
  "scp",
  "prv",
  "gpu",
  "sa",
  "as",
] as const;

if (institutionKeys.length !== institutionValues.length) {
  throw Error(
    "institutionKeys and institutionValues must have the same length",
  );
}

const institutionMap = new Map(
  institutionKeys.map((key, index) => [
    key,
    {
      tag: key,
      value: institutionValues[index],
    },
  ]),
) as Map<
  (typeof institutionKeys)[number],
  {
    tag: (typeof institutionKeys)[number];
    value: string;
  }
>;

export const institutionOptionsByProduct = new Map([
  [
    "prod-pagopa",
    [
      institutionMap.get("pa"),
      institutionMap.get("gsp"),
      institutionMap.get("psp"),
      institutionMap.get("pt"),
      institutionMap.get("prv"),
      institutionMap.get("gpu"),
      institutionMap.get("scp"),
    ],
  ],

  [
    "prod-interop",
    [
      institutionMap.get("pa"),
      institutionMap.get("gsp"),
      institutionMap.get("scp"),
      institutionMap.get("sa"),
      institutionMap.get("as"),
      institutionMap.get("prv"),
    ],
  ],
  ["prod-pn", [institutionMap.get("pa"), institutionMap.get("gsp")]],
  [
    "prod-io",
    [
      institutionMap.get("pa"),
      institutionMap.get("gsp"),
      institutionMap.get("scp"),
    ],
  ],
  [
    "prod-io-sign",
    [
      institutionMap.get("pa"),
      institutionMap.get("gsp"),
      institutionMap.get("scp"),
    ],
  ],
  [
    "", // Generic/default
    [
      institutionMap.get("psp"),
      institutionMap.get("pa"),
      institutionMap.get("gsp"),
      institutionMap.get("pt"),
      institutionMap.get("scp"),
      institutionMap.get("prv"),
      institutionMap.get("gpu"),
      institutionMap.get("sa"),
      institutionMap.get("as"),
    ],
  ],
]) as Map<
  (typeof productKeys)[number],
  {
    tag: (typeof institutionKeys)[number];
    value: string;
  }[]
>;

export const productKeys = [
  "prod-pagopa",
  "prod-interop",
  "prod-pn",
  "prod-io",
  "prod-io-sign",
  "",
] as const;
export type ProductKeys = (typeof productKeys)[number];

export const productValues = [
  "PAGOPA",
  "INTEROP",
  "SEND",
  "IO",
  "FIRMA con IO",
] as const;

export const productsMap = new Map<string, string>([
  [productKeys[0], productValues[0]],
  [productKeys[1], productValues[1]],
  [productKeys[2], productValues[2]],
  [productKeys[3], productValues[3]],
  [productKeys[4], productValues[4]],
]);

export const productOptions: ProductOptions = [];
for (const [key, value] of productsMap) {
  productOptions.push({
    tag: key as Exclude<(typeof productKeys)[number], "">,
    value,
  });
}

export const apiOriginValues = [
  "IPA",
  "SELC",
  "INFOCAMERE",
  "PDND_INFOCAMERE",
  "IVASS",
] as const;

export const roleValues = [
  "MANAGER",
  "OPERATOR",
  "DELEGATE",
  "SUB-DELEGATE",
] as const;

export const roleOptions: RoleOptions = [
  { tag: "manager", value: roleValues[0] },
  { tag: "operator", value: roleValues[1] },
  { tag: "delegate", value: roleValues[2] },
  { tag: "subdelegate", value: roleValues[3] },
];

export const subunitValues = ["Apicale", "AOO", "UO"] as const;
export const apiOptionsApicale = ["selfcare", "ipa", "infocamere"] as const;

export const VAT_NUMBER_LENGTH = 11;
export const TAXCODE_BUSINESS_LENGTH = 11;
export const TAXCODE_PRIVATE_LENGTH = 16;
export const ZIPCODE_LENGTH = 5;
export const AOO_CODE_LENGTH = 7;
export const UO_CODE_LENGTH = 6;

export const trueFalseOptions = ["true", "false"] as const;

export const translations = new Map<string, string>([
  ["taxcode", "Codice fiscale"],
  ["subunitCode", "Codice univoco"],
  ["businessName", "Ragione sociale"],
  ["digitalAddress", "PEC"],
  ["vatNumber", "Partita iva"],
  ["city", "Città"],
  ["istatCode", "Codice Istat"],
  ["registeredOffice", "Sede legale"],
  ["county", "Comune"],
  ["zipCode", "Codice avviamento postale"],
  ["country", "Paese"],
  ["recipientCode", "Codice SDI"],
  ["originId", "OriginId"],
]);
export type Translations = typeof translations;

export const ipaAOO_stepOne_map = new Map([
  ["subunitCode", "id"],
  ["taxcode", "codiceFiscaleEnte"],
  ["businessName", "denominazioneAoo"],
  ["digitalAddress", "mail1"],
  ["origin", "origin"],
  ["originId", "id"],
  ["address", "indirizzo"],
  ["registeredOffice", "indirizzo"],
  ["zipCode", "CAP"],
] as const);

export const ipaUO_stepOne_map = new Map([
  ["subunitCode", "id"],
  ["taxcode", "codiceFiscaleEnte"],
  ["businessName", "descrizioneUo"],
  ["digitalAddress", "mail1"],
  ["origin", "origin"],
  ["originId", "id"],
  ["address", "indirizzo"],
  ["registeredOffice", "indirizzo"],
  ["zipCode", "CAP"],
] as const);

export const apicale_selfcare_stepOne_map = new Map([
  ["id", "id"],
  ["externalId", "externalId"],
  ["origin", "origin"],
  ["originId", "originId"],
  ["istatCode", "istatCode"],
  ["businessName", "description"],
  ["legalRegisterName", "description"],
  ["digitalAddress", "digitalAddress"],
  ["address", "address"],
  ["zipCode", "zipCode"],
  ["taxcode", "taxCode"],
  ["city", "city"],
  ["county", "county"],
  ["country", "country"],
  ["registeredOffice", "address"],
] as const);

export const apicale_ipa_stepOne_map = new Map([
  ["taxcode", "taxCode"],
  ["originId", "originId"],
  ["businessName", "description"],
  ["registeredOffice", "address"],
  ["digitalAddress", "digitalAddress"],
  ["address", "address"],
  ["zipCode", "zipCode"],
] as const);

export const apicale_infocamere_stepOne_map = new Map([
  ["businessName", "businessName"],
  ["digitalAddress", "digitalAddress"],
  ["city", "city"],
  ["county", "county"],
  ["zipCode", "zipCode"],
  ["address", "address"],
  ["digitalAddress", "digitalAddress"],
] as const);
