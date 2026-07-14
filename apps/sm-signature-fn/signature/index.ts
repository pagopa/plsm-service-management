import { app } from "@azure/functions";
import { health } from "./health";
import { validateSignature } from "./handler";

app.http("health", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "health", // URL: /api/v1/health
  handler: health,
});

app.http("validateSignature", {
  methods: ["POST"],
  authLevel: "function", // Azure native function key
  route: "validate-signature", // URL: /api/v1/validate-signature
  handler: validateSignature,
});
