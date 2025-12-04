import { createFetch } from "@better-fetch/fetch";

export const $api = createFetch({
  baseURL: "http://localhost:3000/api",
  retry: {
    type: "linear",
    attempts: 3,
    delay: 1000,
  },
});
