import { Hono } from 'hono';

import dynamicsRoutes from './routes/dynamics.js';
import healthRoute from './routes/health.js';
import { getConfigOrThrow } from './utils/configEnv.js';

export function createApp() {
  const app = new Hono();
  const config = getConfigOrThrow();

  app.route('/', healthRoute);
  app.route('/dynamics', dynamicsRoutes);
  return { app, config };
}
