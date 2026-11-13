import { logQuerySchema, matchesLogFilters } from "@/lib/log-filters";
import { subscribeLogEvets } from "@/lib/services/logs.service";
import { checkLogReadAccess } from "@/lib/auth/logs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await checkLogReadAccess();
  if (denied) return denied;
  const query = logQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success)
    return Response.json(
      { message: "Parametri di ricerca non validi." },
      { status: 400 },
    );
  const { q, level, service, range } = query.data;
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;
  let closed = false;
  let closeStream: (() => void) | undefined;

  function cleanup() {
    if (closed) return;
    closed = true;
    clearInterval(interval);
    unsubscribe?.();
    request.signal.removeEventListener("abort", abort);
  }
  function abort() {
    cleanup();
    closeStream?.();
  }

  const stream = new ReadableStream({
    start(controller) {
      closeStream = () => controller.close();
      const send = (data: string) => {
        if (!closed) controller.enqueue(encoder.encode(data));
      };
      unsubscribe = subscribeLogEvets((log) => {
        if (!matchesLogFilters(log, { q, level, service, range })) return;
        // Notifications need only an ID; full detail remains on demand.
        send(`data: ${JSON.stringify({ id: log.id })}\n\n`);
      });
      interval = setInterval(() => send(`event: ping\ndata: {}\n\n`), 15_000);
      request.signal.addEventListener("abort", abort, { once: true });
      if (request.signal.aborted) abort();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
