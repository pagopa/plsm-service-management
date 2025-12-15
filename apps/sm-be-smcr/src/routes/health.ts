import { Hono } from 'hono';

const healthRoute = new Hono();

healthRoute.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default healthRoute;
