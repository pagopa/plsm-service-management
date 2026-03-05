import { createFetch } from "@better-fetch/fetch";
import { clientEnv } from "@/config/env";

export const $fetch = createFetch({
  baseURL: `${clientEnv.NEXT_PUBLIC_APP_URL}`,
});
