/**
 * Wakes the upstream services and checks the database. Free Render instances sleep after 15 minutes without
 * traffic; one call to the gateway's /wake sends a request to each of them (that traffic keeps them awake).
 */
export class WakeService {
  constructor({ services, timeoutMs = 60000 }) {
    this.services = services;
    this.timeoutMs = timeoutMs;
  }

  async run({ mode = 'all' } = {}) {
    const dbProbe = ['db', `${this.services.auth}/health/db`];
    const probes =
      mode === 'db'
        ? [dbProbe]
        : [...Object.entries(this.services).map(([name, url]) => [name, `${url}/health`]), dbProbe];

    const started = Date.now();
    const entries = await Promise.all(
      probes.map(async ([name, url]) => {
        const t0 = Date.now();
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
          return [name, { ok: res.ok, status: res.status, ms: Date.now() - t0 }];
        } catch (err) {
          return [name, { ok: false, error: err.name === 'TimeoutError' ? 'timeout' : err.message, ms: Date.now() - t0 }];
        }
      }),
    );
    return { ok: entries.every(([, r]) => r.ok), ms: Date.now() - started, results: Object.fromEntries(entries) };
  }
}
