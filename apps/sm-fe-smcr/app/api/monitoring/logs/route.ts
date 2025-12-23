import logger from "@/lib/logger/logger.server";
import { logSchema, readLogs, saveLog } from "@/lib/services/logs.service";
import { z } from "zod";

export async function GET() {
  const { data, error } = await readLogs();
  if (error) {
    logger.error({ data: data, error }, error);
    return Response.json({ message: error }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = logSchema.omit({ id: true }).safeParse(body);

  if (!result.success) {
    console.warn(
      "log validation error",
      z.flattenError(result.error).fieldErrors,
    );
    return Response.json(
      { message: z.flattenError(result.error).fieldErrors },
      { status: 422 },
    );
  }

  const { data, error } = await saveLog(result.data);
  if (error) {
    logger.error({ data: result.data, error }, error);
    return Response.json({ message: error }, { status: 500 });
  }

  return Response.json(data, { status: 201 });
}
