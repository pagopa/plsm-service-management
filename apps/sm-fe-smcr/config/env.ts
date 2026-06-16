import { z } from "zod";

const optionalString = z.string().optional();

const serverEnvSchema = z.object({
  // API Keys
  FE_SMCR_USERS_API_KEY: optionalString,
  FE_SMCR_API_KEY_SUBSCRIPTION_KEY_BILLING_PORTAL: optionalString,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY: optionalString,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT: optionalString,
  FE_SMCR_API_KEY_INSTITUTION: optionalString,
  FE_SMCR_API_KEY_INSTITUTION_UAT: optionalString,
  FE_SMCR_API_KEY_PROD_GET_USERS: optionalString,
  FE_SMCR_API_KEY_SERVICES: optionalString,
  FE_SMCR_API_KEY_PNPG: optionalString,
  FE_SMCR_API_KEY_FIRMA_CON_IO: optionalString,
  FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID: optionalString,
  FE_SMCR_API_KEY_CERTIFICATI: optionalString,
  FE_SMCR_API_KEY_UTENTI_IO: optionalString,

  // Slack webhooks
  FE_SMCR_API_SLACK_REPORT_HOOK: optionalString,
  FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST: optionalString,
  FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD: optionalString,

  // CRM API (Meetings)
  FE_SMCR_CRM_API_URL: optionalString,
  FE_SMCR_CRM_API_KEY: optionalString,

  // Database
  DB_HOST: optionalString,
  DB_NAME: optionalString,
  DB_USER: optionalString,
  DB_PASSWORD_B64: optionalString,
  DB_PORT: optionalString,
  DB_SSL: optionalString,

  // Onboarding paths
  UPLOAD: z.string().default(""),
  ONBOARDING_BASE_PATH: optionalString,
  ONBOARDING_BASE_PATH_UAT: optionalString,
  GET_STATUS: optionalString,
  GET_USERS_PATH: optionalString,
  GET_INSTITUTION: optionalString,
  GET_IPA: optionalString,
  GET_IPA_AOO: optionalString,
  GET_IPA_UO: optionalString,
  GET_INFOCAMERE: optionalString,

  // PDND Interoperabilita DPoP client
  PDND_ENV: optionalString,
  PDND_CLIENT_ID: optionalString,
  PDND_CLIENT_ASSERTION_KID: optionalString,
  PDND_CLIENT_ASSERTION_AUDIENCE: optionalString,
  PDND_AUTH_TOKEN_URL: optionalString,
  PDND_API_BASE_URL: optionalString,
  PDND_CLIENT_ASSERTION_PRIVATE_KEY: optionalString,
  PDND_DPOP_PRIVATE_KEY: optionalString,
  PDND_CLIENT_ASSERTION_TTL_SECONDS: optionalString,
  PDND_TOKEN_REFRESH_MARGIN_SECONDS: optionalString,
  PDND_REQUEST_TIMEOUT_MS: optionalString,

  // Azure Storage
  FE_SMCR_AZURE_STORAGE_CONNECTION_STRING: optionalString,
  FE_SMCR_AZURE_STORAGE_CONTAINER: z.string().default("config"),
  FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX: optionalString,
  FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO: optionalString,
  FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX: optionalString,
  FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET: optionalString,
  FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX: optionalString,

  // Portale Fatturazione
  STORAGE_TOKEN: optionalString,
  WEBHOOK_MANUAL_STORAGE: optionalString,

  // Logger
  FE_SMCR_LOGS_ENDPOINT: optionalString,
  FE_SMCR_LOG_LEVEL: optionalString,

  // SMTP
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_MSAL_CLIENT_ID: z.string().default(""),
  NEXT_PUBLIC_MSAL_TENANT_ID: optionalString,
  NEXT_PUBLIC_MSAL_REDIRECT_URI: optionalString,
  NEXT_PUBLIC_APP_URL: optionalString,
});

const rawServerEnv = {
  FE_SMCR_USERS_API_KEY: process.env.FE_SMCR_USERS_API_KEY,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY:
    process.env.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY,
  FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT:
    process.env.FE_SMCR_OCP_APIM_SUBSCRIPTION_KEY_UAT,
  FE_SMCR_API_KEY_INSTITUTION: process.env.FE_SMCR_API_KEY_INSTITUTION,
  FE_SMCR_API_KEY_INSTITUTION_UAT: process.env.FE_SMCR_API_KEY_INSTITUTION_UAT,
  FE_SMCR_API_KEY_PROD_GET_USERS: process.env.FE_SMCR_API_KEY_PROD_GET_USERS,
  FE_SMCR_API_KEY_SERVICES: process.env.FE_SMCR_API_KEY_SERVICES,
  FE_SMCR_API_KEY_PNPG: process.env.FE_SMCR_API_KEY_PNPG,
  FE_SMCR_API_KEY_FIRMA_CON_IO: process.env.FE_SMCR_API_KEY_FIRMA_CON_IO,
  FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID:
    process.env.FE_SMCR_API_KEY_FIRMA_CON_IO_SIGNER_ID,
  FE_SMCR_API_KEY_CERTIFICATI: process.env.FE_SMCR_API_KEY_CERTIFICATI,
  FE_SMCR_API_KEY_UTENTI_IO: process.env.FE_SMCR_API_KEY_UTENTI_IO,
  FE_SMCR_API_KEY_SUBSCRIPTION_KEY_BILLING_PORTAL:
    process.env.FE_SMCR_API_KEY_SUBSCRIPTION_KEY_BILLING_PORTAL,
  FE_SMCR_API_SLACK_REPORT_HOOK: process.env.FE_SMCR_API_SLACK_REPORT_HOOK,
  FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST:
    process.env.FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_TEST,
  FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD:
    process.env.FE_SMCR_API_SLACK_CALL_MANAGEMENT_HOOK_PROD,
  FE_SMCR_CRM_API_URL: process.env.FE_SMCR_CRM_API_URL,
  FE_SMCR_CRM_API_KEY: process.env.FE_SMCR_CRM_API_KEY,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD_B64: process.env.DB_PASSWORD_B64,
  DB_PORT: process.env.DB_PORT,
  DB_SSL: process.env.DB_SSL,
  UPLOAD: process.env.UPLOAD,
  ONBOARDING_BASE_PATH: process.env.ONBOARDING_BASE_PATH,
  ONBOARDING_BASE_PATH_UAT: process.env.ONBOARDING_BASE_PATH_UAT,
  GET_STATUS: process.env.GET_STATUS,
  GET_USERS_PATH: process.env.GET_USERS_PATH,
  GET_INSTITUTION: process.env.GET_INSTITUTION,
  GET_IPA: process.env.GET_IPA,
  GET_IPA_AOO: process.env.GET_IPA_AOO,
  GET_IPA_UO: process.env.GET_IPA_UO,
  GET_INFOCAMERE: process.env.GET_INFOCAMERE,
  PDND_ENV: process.env.PDND_ENV,
  PDND_CLIENT_ID: process.env.PDND_CLIENT_ID,
  PDND_CLIENT_ASSERTION_KID: process.env.PDND_CLIENT_ASSERTION_KID,
  PDND_CLIENT_ASSERTION_AUDIENCE: process.env.PDND_CLIENT_ASSERTION_AUDIENCE,
  PDND_AUTH_TOKEN_URL: process.env.PDND_AUTH_TOKEN_URL,
  PDND_API_BASE_URL: process.env.PDND_API_BASE_URL,
  PDND_CLIENT_ASSERTION_PRIVATE_KEY:
    process.env.PDND_CLIENT_ASSERTION_PRIVATE_KEY,
  PDND_DPOP_PRIVATE_KEY: process.env.PDND_DPOP_PRIVATE_KEY,
  PDND_CLIENT_ASSERTION_TTL_SECONDS:
    process.env.PDND_CLIENT_ASSERTION_TTL_SECONDS,
  PDND_TOKEN_REFRESH_MARGIN_SECONDS:
    process.env.PDND_TOKEN_REFRESH_MARGIN_SECONDS,
  PDND_REQUEST_TIMEOUT_MS: process.env.PDND_REQUEST_TIMEOUT_MS,
  FE_SMCR_AZURE_STORAGE_CONNECTION_STRING:
    process.env.FE_SMCR_AZURE_STORAGE_CONNECTION_STRING,
  FE_SMCR_AZURE_STORAGE_CONTAINER: process.env.FE_SMCR_AZURE_STORAGE_CONTAINER,
  FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX:
    process.env.FE_SMCR_AZURE_STORAGE_ONBOARDING_PRODUCTS_BLOB_PREFIX,
  FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO:
    process.env.FE_SMCR_AZURE_STORAGE_CONTAINER_FIRMA_CON_IO,
  FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX:
    process.env.FE_SMCR_AZURE_STORAGE_FIRMA_CON_IO_BLOB_PREFIX,
  FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET:
    process.env.FE_SMCR_AZURE_STORAGE_CONTAINER_WALLET,
  FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX:
    process.env.FE_SMCR_AZURE_STORAGE_WALLET_BLOB_PREFIX,
  STORAGE_TOKEN: process.env.STORAGE_TOKEN,
  WEBHOOK_MANUAL_STORAGE: process.env.WEBHOOK_MANUAL_STORAGE,
  FE_SMCR_LOGS_ENDPOINT: process.env.FE_SMCR_LOGS_ENDPOINT,
  FE_SMCR_LOG_LEVEL: process.env.FE_SMCR_LOG_LEVEL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

const rawClientEnv = {
  NEXT_PUBLIC_MSAL_CLIENT_ID: process.env.NEXT_PUBLIC_MSAL_CLIENT_ID,
  NEXT_PUBLIC_MSAL_TENANT_ID: process.env.NEXT_PUBLIC_MSAL_TENANT_ID,
  NEXT_PUBLIC_MSAL_REDIRECT_URI: process.env.NEXT_PUBLIC_MSAL_REDIRECT_URI,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};

const serverEnvParse = serverEnvSchema.safeParse(rawServerEnv);
if (!serverEnvParse.success) {
  process.stderr.write(
    `Invalid server env configuration: ${JSON.stringify(serverEnvParse.error.issues)}\n`,
  );
  throw new Error("Invalid server env configuration");
}

const clientEnvParse = clientEnvSchema.safeParse(rawClientEnv);
if (!clientEnvParse.success) {
  process.stderr.write(
    `Invalid client env configuration: ${JSON.stringify(clientEnvParse.error.issues)}\n`,
  );
  throw new Error("Invalid client env configuration");
}

export const serverEnv = serverEnvParse.data;
export const clientEnv = clientEnvParse.data;
