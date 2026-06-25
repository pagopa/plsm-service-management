import assert from 'node:assert/strict'
import { validateConfig } from '../_shared/utils/config'

const baseConfig = {
  DYNAMICS_BASE_URL: 'https://pagopa.crm4.dynamics.com',
  DYNAMICS_BASE_URL_UAT: 'https://uat-pagopa.crm4.dynamics.com',
  CRM_PRODUCTS_MAP_UAT: '{"prod-io":"11111111-1111-1111-1111-111111111111"}',
  CRM_PRODUCTS_MAP_PROD: '{"prod-io":"22222222-2222-2222-2222-222222222222"}',
}

const tipologiaMap = {
  APICALE: 100000000,
  DIRETTO: 100000001,
  TECNICO: 100000002,
  BUSINESS: 100000003,
  ACCOUNT: 100000004,
  RESPONSABILE_DI_TRASFORMAZIONE_DIGITALE: 100000005,
  REFERENTE_CONTRATTUALE: 100000006,
  RESPONSABILE_PROTEZIONE_DATI: 100000007,
  REFERENTE_BUSINESS_APICALE_ACCOUNT: 100000008,
}

const configFromObject = validateConfig({
  ...baseConfig,
  CRM_TIPOLOGIA_REFERENTE_MAP_UAT: tipologiaMap,
  CRM_TIPOLOGIA_REFERENTE_MAP_PROD: tipologiaMap,
})

assert.equal(configFromObject.CRM_TIPOLOGIA_REFERENTE_MAP_UAT.TECNICO, 100000002)
assert.equal(configFromObject.CRM_TIPOLOGIA_REFERENTE_MAP_PROD.ACCOUNT, 100000004)

const configFromJsonStringWithNumbers = validateConfig({
  ...baseConfig,
  CRM_TIPOLOGIA_REFERENTE_MAP_UAT: JSON.stringify(tipologiaMap),
  CRM_TIPOLOGIA_REFERENTE_MAP_PROD: JSON.stringify(tipologiaMap),
})

assert.equal(
  configFromJsonStringWithNumbers
    .CRM_TIPOLOGIA_REFERENTE_MAP_UAT
    .REFERENTE_BUSINESS_APICALE_ACCOUNT,
  100000008,
)
