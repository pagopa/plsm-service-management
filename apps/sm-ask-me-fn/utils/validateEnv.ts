import { z } from 'zod'
import 'dotenv/config'

const envSchema = z.object({
  APPINSIGHTS_CONNECTION_STRING: z.string(),
  APPINSIGHTS_SAMPLING_PERCENTAGE: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive(),
  ),
  SERVICENAME: z.string(),
  SLACK_BOT_TOKEN: z.string(),
  SLACK_SIGNING_SECRET: z.string(),
  SLACK_API_URL: z.string(),
  INSTITUTION_URL: z.string(),
  USERS_URL: z.string(),
  CONTRACT_URL: z.string(),
  OCP_APIM_SUBSCRIPTION_KEY: z.string(),
  USERS_APIM_SUBSCRIPTION_KEY: z.string(),
  CONTRACT_APIM_SUBSCRIPTION_KEY: z.string(),
  ENABLED_EMAILS_SECRET: z
    .string()
    .transform((value) => value.split(';'))
    .transform((value) => value.map((item) => item.trim())),
  LEGAL_ENABLED_EMAILS_SECRET: z
    .string()
    .transform((value) => value.split(';'))
    .transform((value) => value.map((item) => item.trim())),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().positive(),
  ),
  SMTP_SECURE: z.preprocess(
    (value) => JSON.parse(z.string().parse(value)),
    z.boolean(),
  ),
  SMTP_USERNAME: z.string(),
  SMTP_PASSWORD: z.string(),
  FROM_EMAIL: z.string(),
  CCN_EMAIL: z.string().email(),
  MAX_DATA_LENGTH: z.preprocess(
    (a) => parseInt(a as string, 10),
    z.number().positive(),
  ),
})

const envParse = envSchema.safeParse({
  APPINSIGHTS_CONNECTION_STRING: process.env.APPINSIGHTS_CONNECTION_STRING,
  APPINSIGHTS_SAMPLING_PERCENTAGE: process.env.APPINSIGHTS_SAMPLING_PERCENTAGE,
  SERVICENAME: process.env.SERVICENAME,
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  SLACK_API_URL: process.env.SLACK_API_URL,
  INSTITUTION_URL: process.env.INSTITUTION_URL,
  USERS_URL: process.env.USERS_URL,
  CONTRACT_URL: process.env.CONTRACT_URL,
  OCP_APIM_SUBSCRIPTION_KEY: process.env.OCP_APIM_SUBSCRIPTION_KEY,
  USERS_APIM_SUBSCRIPTION_KEY: process.env.USERS_APIM_SUBSCRIPTION_KEY,
  CONTRACT_APIM_SUBSCRIPTION_KEY: process.env.CONTRACT_APIM_SUBSCRIPTION_KEY,
  ENABLED_EMAILS_SECRET: process.env.ENABLED_EMAILS_SECRET,
  LEGAL_ENABLED_EMAILS_SECRET: process.env.LEGAL_ENABLED_EMAILS_SECRET,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_USERNAME: process.env.SMTP_USERNAME,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  FROM_EMAIL: process.env.FROM_EMAIL,
  CCN_EMAIL: process.env.CCN_EMAIL,
  MAX_DATA_LENGTH: process.env.MAX_DATA_LENGTH,
})

if (!envParse.success) {
  console.error(envParse.error.issues)
  throw new Error('Error on you env configuration')
}

export const envData = envParse.data
