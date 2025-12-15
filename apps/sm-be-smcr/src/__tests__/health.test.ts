import { describe, it, expect } from 'vitest';

import { createApp } from '../app.js';


describe('Health Check', () => {
  it('should return 200 and status ok', async () => {
    const { app } = createApp();
    const res = await app.request('http://localhost/health');
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
  });
});
