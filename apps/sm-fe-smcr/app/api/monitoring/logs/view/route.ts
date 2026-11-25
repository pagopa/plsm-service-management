import { logQuerySchema } from "@/lib/log-filters";
import { readLogView } from "@/lib/services/logs.service";
import { checkLogReadAccess } from "@/lib/auth/logs";

export async function GET(request: Request) {
  const denied = await checkLogReadAccess();
  if (denied) return denied;
  const query = logQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) {
    return Response.json(
      { message: "Parametri di ricerca non validi." },
      { status: 400 },
    );
  }

  const { q, level, service, range } = query.data;
  const { data, error } = await readLogView({ q, level, service, range });
  return Response.json(error ? { message: error } : data, {
    status: error ? 500 : 200,
    headers: { "Cache-Control": "no-store" },
  });
}
