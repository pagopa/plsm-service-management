"use server";

import { betterFetch } from "@better-fetch/fetch";
import z from "zod";

const LIMIT = 20;

export type Service = {
  id: string;
  name: string;
  version: number;
  currentlyOwnerFiscalCode: boolean;
  currentlyOwnerOrgName: boolean;
  isVisible: boolean;
  topic: string | null;
  subTopic: string | null;
  departmentName: string;
  maxAllowedPaymentAmount: number;
  requireSecureChannels: boolean;
  metadata: {
    scope: string;
    address: string;
    appAndroid: string;
    appIos: string;
    cta: string;
    description: string;
    email: string;
    pec: string;
    phone: string;
    privacyUrl: string;
    supportUrl: string;
    tokenName: string;
    webUrl: string;
  };
};

export async function getServices(query: string) {
  const { data, error } = await betterFetch(
    `https://api.pdnd.pagopa.it/io-stats/organization/services?limit=${LIMIT}&offset=${0}&q=${query}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.FE_SMCR_API_KEY_SERVICES as string,
      },
      output: z.object({
        items: z.array(
          z.object({
            organization_fiscal_code: z.string(),
            organization_name: z.string(),
            services_list: z.array(
              z.object({
                service_id: z.string(),
                service_name: z.string(),
                version: z.number(),
                currently_owner_fiscalcode: z.boolean(),
                currently_owner_org_name: z.boolean(),
                is_visible: z.boolean(),
                topic: z.string().optional().nullable(),
                subtopic: z.string().optional().nullable(),
                department_name: z.string(),
                max_allowed_payment_amount: z.number(),
                require_secure_channels: z.boolean(),
                metadata: z.object({
                  scope: z.string(),
                  address: z.string(),
                  app_android: z.string(),
                  app_ios: z.string(),
                  cta: z.string(),
                  description: z.string(),
                  email: z.string(),
                  pec: z.string(),
                  phone: z.string(),
                  privacy_url: z.string(),
                  support_url: z.string(),
                  token_name: z.string(),
                  web_url: z.string(),
                }),
              }),
            ),
          }),
        ),
        pagination: z.object({
          offset: z.number(),
          limit: z.number(),
        }),
      }),
    },
  );

  if (error) {
    console.error(error);
    return { data: null, error: "Error" };
  }

  return {
    data: data.items.map((item) => {
      return {
        organizationFiscalCode: item.organization_fiscal_code,
        organizationName: item.organization_name,
        services: item.services_list
          .sort((a, b) => a.service_name.localeCompare(b.service_name))
          .map((service) => {
            return {
              id: service.service_id,
              name: service.service_name,
              version: service.version,
              currentlyOwnerFiscalCode: service.currently_owner_fiscalcode,
              currentlyOwnerOrgName: service.currently_owner_org_name,
              isVisible: service.is_visible,
              topic: service.topic || null,
              subTopic: service.subtopic || null,
              departmentName: service.department_name,
              maxAllowedPaymentAmount: service.max_allowed_payment_amount,
              requireSecureChannels: service.require_secure_channels,
              metadata: {
                scope: service.metadata.scope,
                address: service.metadata.address,
                appAndroid: service.metadata.app_android,
                appIos: service.metadata.app_ios,
                cta: service.metadata.cta,
                description: service.metadata.description,
                email: service.metadata.email,
                pec: service.metadata.pec,
                phone: service.metadata.phone,
                privacyUrl: service.metadata.privacy_url,
                supportUrl: service.metadata.support_url,
                tokenName: service.metadata.token_name,
                webUrl: service.metadata.web_url,
              },
            };
          }),
      };
    }),
    error: null,
  };
}

export async function getMessagesCount(
  serviceId: string,
  featureLevel: string,
  date: string,
) {
  const { data, error } = await betterFetch(
    `https://api.pdnd.pagopa.it/io-stats/message/count?q=service_id:${serviceId},feature_level_type:${featureLevel.toUpperCase()},sent_after:${date}`,
    {
      method: "GET",
      headers: {
        "x-api-key": process.env.FE_SMCR_API_KEY_SERVICES as string,
      },
      output: z.any(),
    },
  );

  if (error) {
    console.error(error);
    return { data: null, error: "Error" };
  }

  return { data, error: null };
}
