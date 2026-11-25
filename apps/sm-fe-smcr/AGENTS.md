
<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Logging

- Reuse `lib/logger/`; do not use `console.*` for application logs or introduce another logger.
- **Server:** prefer `logServerError(error, message, metadata?)` and `logServerInfo(message, metadata?)` from `@/lib/logger/logger.server.helpers`. For other levels or structured context, use the default `logger` from `@/lib/logger/logger.server`: `logger.warn(context, message)`. Normalize unknown errors with `toLogError` from `@/lib/logger/logger.utils` when using the logger directly.
- **Client:** use the default `clientLogger` from `@/lib/logger/logger.client`, e.g. `void clientLogger.error({ error, info: { metadata: { resourceId } } }, "loadResource - failed")`. Never import server loggers into client components.
- Put custom data in `info.metadata`, event names in `info.event`, and HTTP details in `request: { method, path, statusCode }`. Reuse `requestId` when correlating logs; do not invent top-level fields.
- Use concise messages identifying the operation; `info` for meaningful events, `warn` for recoverable anomalies, `error` for failures. Avoid logging the same failure at multiple layers.
- Never log secrets or unnecessary personal data; select safe metadata instead of dumping entire requests or payloads.
