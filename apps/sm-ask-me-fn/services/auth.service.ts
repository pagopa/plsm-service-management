import { envData } from "../utils/validateEnv";
import messages from "../utils/messages";
import { $api } from "../utils/fetch";
import z from "zod";

export const getUserEmailById = async (
  userId: string,
): Promise<{ data: string; error: null } | { data: null; error: string }> => {
  const response = await fetch(
    `${envData.SLACK_API_URL}/users.info?user=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${envData.SLACK_BOT_TOKEN}`,
      },
    },
  );
  const body = await response.json();

  if (!response.ok) {
    return { data: null, error: messages.errors.generic };
  }

  return { data: body.user.profile.email, error: null };
};

export const getPermissions = async (
  userId: string,
): Promise<
  | { data: { selfcare: boolean; legal: boolean }; error: null }
  | { data: null; error: string }
> => {
  console.log("fetching user:", userId);

  const response = await fetch(
    `${envData.SLACK_API_URL}/users.info?user=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${envData.SLACK_BOT_TOKEN}`,
      },
    },
  );
  const body = await response.json();
  console.log("fetched user body:", userId, body);

  if (!response.ok) {
    console.error("error fetching user:", userId, body, response.status);
    return { data: null, error: messages.errors.generic };
  }

  const { data, error } = await $api("/bot/auth", {
    method: "POST",
    body: JSON.stringify({
      email: body.user.profile.email,
    }),
    headers: {
      "content-type": "application/json",
    },
    output: z.object({
      selfcareAccess: z.boolean(),
      legalAccess: z.boolean(),
    }),
  });

  if (error) {
    console.error("error fetching permissions:", userId, error, data);
    return { data: null, error: messages.auth.unauthorized };
  }

  console.log("fetched permissions:", data);

  return {
    data: { selfcare: data.selfcareAccess, legal: data.legalAccess },
    error: null,
  };
};

export const hasSelfcareAccess = async (id: string) => {
  const { data, error } = await getPermissions(id);
  console.log("getPermissions:", data, error);

  if (error || !data) {
    return { data: null, error: messages.auth.unauthorized };
  }

  if (!data.selfcare) {
    return { data: null, error: messages.auth.unauthorized };
  }

  return { data, error: null };
};

export const hasLegalAccess = async (id: string) => {
  const { data, error } = await getPermissions(id);

  if (error || !data) {
    return { data: null, error: messages.auth.unauthorized };
  }

  if (!data.legal) {
    return { data: null, error: messages.auth.unauthorized };
  }

  return { data, error: null };
};
