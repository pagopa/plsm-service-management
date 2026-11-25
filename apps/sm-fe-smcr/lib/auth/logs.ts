import "server-only";

import { hasCurrentPermission } from "./dashboard-access";
import { getServerSession } from "./server";

export async function checkLogReadAccess(): Promise<Response | null> {
  try {
    if (!(await getServerSession())) {
      return Response.json(
        { message: "Accedi per consultare i log." },
        { status: 401 },
      );
    }
    if (!(await hasCurrentPermission("logs.read"))) {
      return Response.json(
        { message: "Non hai il permesso di consultare i log." },
        { status: 403 },
      );
    }
    return null;
  } catch {
    return Response.json(
      { message: "Impossibile verificare l’accesso ai log. Riprova." },
      { status: 503 },
    );
  }
}
