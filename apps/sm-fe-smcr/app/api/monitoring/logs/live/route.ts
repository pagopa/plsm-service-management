import { subscribeLogEvets } from "@/lib/services/logs.service";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const intervalId = setInterval(() => {
        const data = `data: ${JSON.stringify({ type: "ping", timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(data));
      }, 10000);

      subscribeLogEvets((log) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`)),
      );

      // Gestisce la chiusura della connessione
      request.signal.addEventListener("abort", () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
