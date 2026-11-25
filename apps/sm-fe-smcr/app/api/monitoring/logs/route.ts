import { logInputSchema, readLogs, saveLog } from "@/lib/services/logs.service";
import { z } from "zod";
import { logQuerySchema } from "@/lib/log-filters";
import { checkLogReadAccess } from "@/lib/auth/logs";

export async function GET(request: Request) {
  const denied = await checkLogReadAccess();
  if (denied) return denied;
  const { searchParams } = new URL(request.url);
  const query = logQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) {
    return Response.json(
      { message: "Parametri di ricerca non validi." },
      { status: 400 },
    );
  }
  const { data, error } = await readLogs(query.data);
  if (error) {
    process.stderr.write(`read logs error: ${error}\n`);
    return Response.json(
      { message: "Impossibile caricare i log. Riprova." },
      { status: 500 },
    );
  }

  return Response.json(data, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = logInputSchema.safeParse(body);

  if (!result.success) {
    process.stderr.write(
      `log validation error: ${JSON.stringify(z.flattenError(result.error).fieldErrors)}\n`,
    );
    return Response.json(
      { message: z.flattenError(result.error).fieldErrors },
      { status: 422 },
    );
  }

  const { data, error } = await saveLog(result.data);
  if (error) {
    process.stderr.write(`save log error: ${error}\n`);
    return Response.json({ message: error }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
