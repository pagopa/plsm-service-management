import { app } from "@azure/functions";
import { probeDynamicsHandler } from "./handler";

export default app.http("diagnosticsProbeDynamics", {
  methods: ["GET"],
  authLevel: "function",
  route: "diagnostics/probe",
  handler: probeDynamicsHandler,
});
