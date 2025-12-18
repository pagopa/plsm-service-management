import { logSchema } from "@/lib/services/logs.service";
import { z } from "zod";

export async function POST(request: Request) {
  const body = await request.json();
  const result = logSchema.omit({ id: true }).safeParse(body);

  if (!result.success) {
    return Response.json(
      { message: z.flattenError(result.error).fieldErrors },
      { status: 422 },
    );
  }

  return Response.json(result.data);
}
