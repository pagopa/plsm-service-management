import { createFetch } from "@better-fetch/fetch";

export const $api = createFetch({
  baseURL: "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api",
  retry: {
    type: "linear",
    attempts: 3,
    delay: 1000,
  },
});
