import { config } from './config/env.js';
import { ServiceRegistry } from './application/services/serviceRegistry.js';
import { createHttpProxy } from './infrastructure/proxy/httpProxy.js';
import { WakeService } from './application/services/wakeService.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const registry = new ServiceRegistry(config.services);
  const httpProxy = createHttpProxy({ registry, timeoutMs: config.timeoutMs });
  const wake = new WakeService({ services: config.services, timeoutMs: config.timeoutMs });
  return { registry, httpProxy, wake };
}