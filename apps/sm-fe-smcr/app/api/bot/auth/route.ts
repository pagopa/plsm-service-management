import { readAskMeAnythingMember } from "@/lib/services/ask-me-anything.service";
import { z } from "zod";

const schema = z.object({
  email: z.email("Invalid email"),
});

export async function POST(request: Request) {
  const body = await request.json();
  const result = schema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { message: z.prettifyError(result.error) },
      { status: 422 },
    );
  }

  const { data, error } = await readAskMeAnythingMember(result.data.email);

  if (error) {
    return Response.json({ message: "unauthorized" }, { status: 403 });
  }

  return Response.json({
    ...data,
  });
}
