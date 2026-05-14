export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id")
    return new Response(id || "No ID provided", {status: 200})
}