import { app } from "@azure/functions";
import { handler } from "./handler";

export default app.http("manuali", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "manuali",
  handler: handler,
});
