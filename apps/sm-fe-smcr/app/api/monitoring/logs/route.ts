import { logInputSchema, readLogs, saveLog } from "@/lib/services/logs.service";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit"));
  const before = searchParams.get("before");
  const { data, error } = await readLogs({
    limit: Number.isFinite(limit) ? limit : undefined,
    before,
  });
  if (error) {
    process.stderr.write(`read logs error: ${error}\n`);
    return Response.json({ message: error }, { status: 500 });
  }

  return Response.json(data, { status: 200 });
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
