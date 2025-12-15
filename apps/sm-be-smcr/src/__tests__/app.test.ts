import { createServer } from 'http';

import request from 'supertest';
import { describe, it, expect } from 'vitest';

import { createApp } from '../app.js';

describe('Hono app', () => {
  const server = createServer((req, res) => {
    const { app } = createApp();
    app.fetch(req as any, res as any);
  });

  it('health ok', async () => {
    const res = await request(server).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('config ok', async () => {
    const res = await request(server).post('/config');
    expect(res.status).toBe(200);
    expect(res.body?.message).toBe('Configurazione Managed Identity');
  });
});
