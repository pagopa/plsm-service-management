import { createFetch } from "@better-fetch/fetch";
import { envData } from "./validateEnv";

export const $api = createFetch({
  baseURL:
    envData.NODE_ENV === "production"
      ? "https://plsm-p-itn-fe-smcr-app-01.azurewebsites.net/api"
      : "http://localhost:3000/api",
  retry: {
    type: "linear",
    attempts: 3,
    delay: 1000,
  },
});
