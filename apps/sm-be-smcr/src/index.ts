import dotenv from 'dotenv';
import { serve } from '@hono/node-server';
import { createApp } from './app.js';

dotenv.config();

const { app, config } = createApp();

serve(
  {
    fetch: app.fetch,
    port: config.PORT,
  },
  () => {
    console.log(`Server in ascolto su http://localhost:${config.PORT}`);
  }
);
