import { Hono } from 'hono';

import { buildDynamicsUrl, callDynamicsApi, getAccessToken } from '../services/dynamics.js';
import { getConfigOrThrow } from '../utils/configEnv.js';

const router = new Hono();

interface DynamicsResponse {
  value: unknown[];
}

// Questa è la funzione "type guard"
function isDynamicsResponse(data: unknown): data is DynamicsResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'value' in data &&
    // Dopo 'in', TS sa che data ha 'value', ma è 'unknown'.
    // Dobbiamo fare un cast minimo per controllare se è un array.
    Array.isArray((data as { value: unknown }).value)
  );
}
/**
 * GET /dynamics
 */
router.get('/', async (c) => {
  try {
    const url = new URL(c.req.url);
    const endpoint = url.searchParams.get('endpoint');
    const filter = url.searchParams.get('$filter');
    const select = url.searchParams.get('$select');
    const top = url.searchParams.get('$top');

    const { finalUrl, scope } = buildDynamicsUrl({ endpoint, filter, select, top });
    const token = await getAccessToken(scope);
    const data = await callDynamicsApi(finalUrl, token);

    const recordCount = isDynamicsResponse(data) ? data.value.length : 0;

    return c.json({
      success: true,
      message: 'Flusso completato con successo',
      endpoint: finalUrl,
      recordCount,
      data,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return c.json({ error: msg }, 500);
  }
});

/**
 * POST /dynamics/config
 */
router.post('/config', (c) => {
  const cfg = getConfigOrThrow();
  const config = {
    managedIdentity: {
      type: cfg.NODE_ENV === 'development' ? 'Azure CLI' : 'System-Assigned',
      note: cfg.NODE_ENV === 'development' ? 'Richiede `az login`' : 'Automatico',
    },
    dynamics: {
      url: cfg.DYNAMICS_URL || '❌ NOT SET',
      scope: cfg.DYNAMICS_SCOPE ?? `${cfg.DYNAMICS_BASE_URL}/.default`,
    },
    environment: {
      hasIdentityEndpoint: Boolean(process.env.IDENTITY_ENDPOINT),
      hasIdentityHeader: Boolean(process.env.IDENTITY_HEADER),
      nodeEnv: cfg.NODE_ENV,
    },
  };
  return c.json({
    message: 'Configurazione Managed Identity',
    config,
    ready: Boolean(cfg.DYNAMICS_URL && (cfg.DYNAMICS_SCOPE ?? true)),
  });
});

export default router;
