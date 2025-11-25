import { createFetch } from "@better-fetch/fetch";

export const $fetch = createFetch({
  baseURL: `${process.env.NEXT_PUBLIC_APP_URL}`,
});
