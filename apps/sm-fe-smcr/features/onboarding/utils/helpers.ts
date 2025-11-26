import { GetInfocamereSchema } from "../types/getInfocamereSchema";
import { GetIpaSchema } from "../types/getIpaSchema";
import { GetIpaSchemaAOO } from "../types/getIpaSchemaAOO";
import { GetIpaSchemaUO } from "../types/getIpaSchemaUO";
import { GetSelfCareSchema } from "../types/getSelfCareSchema";
import { SubunitOption } from "../types/subunitOptionsType";

export function isIpaAOOData(
  data:
    | GetSelfCareSchema
    | GetIpaSchema
    | GetInfocamereSchema
    | GetIpaSchemaAOO
    | GetIpaSchemaUO
    | null,
  subunit: SubunitOption
): data is GetIpaSchemaAOO {
  return subunit === "AOO" && data !== null;
}
export function isIpaUOData(
  data:
    | GetSelfCareSchema
    | GetIpaSchema
    | GetInfocamereSchema
    | GetIpaSchemaAOO
    | GetIpaSchemaUO
    | null,
  subunit: SubunitOption
): data is GetIpaSchemaUO {
  return subunit === "UO" && data !== null;
}
export function isApicaleSelfCareData(
  data:
    | GetSelfCareSchema
    | GetIpaSchema
    | GetInfocamereSchema
    | GetIpaSchemaAOO
    | GetIpaSchemaUO
    | null,
  endpoint: string | undefined
): data is GetSelfCareSchema {
  return endpoint === "selfcare" && data !== null;
}
export function isApicaleIpaData(
  data: GetSelfCareSchema | GetIpaSchema | GetInfocamereSchema | null,
  endpoint: string | undefined
): data is GetIpaSchema {
  return endpoint === "ipa" && data !== null;
}
export function isApicaleInfoCamereData(
  data: GetSelfCareSchema | GetIpaSchema | GetInfocamereSchema | null,
  endpoint: string | undefined
): data is GetInfocamereSchema {
  return endpoint === "infocamere" && data !== null;
}
