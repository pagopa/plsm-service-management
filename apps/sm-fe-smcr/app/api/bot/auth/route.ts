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

  // Ask Me Anything service removed — respond with 404
  return Response.json({ message: "Ask Me Anything service removed" }, { status: 404 });
}
