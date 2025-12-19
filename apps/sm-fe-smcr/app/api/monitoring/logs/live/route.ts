import { subscribeLogEvets } from "@/lib/services/logs.service";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let unsubscribe: null | (() => void) = null;

  const stream = new ReadableStream({
    async start(controller) {
      const sendHeartbeat = () => {
        const data = `event: ping\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      intervalId = setInterval(sendHeartbeat, 15000);

      unsubscribe = subscribeLogEvets((log) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`)),
      );

      request.signal.addEventListener("abort", () => {
        console.log({ message: "ABORT" });
        if (intervalId) clearInterval(intervalId);
        if (unsubscribe) unsubscribe();
        controller.close();
      });
    },

    cancel() {
      if (intervalId) clearInterval(intervalId);
      if (unsubscribe) unsubscribe();
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
