/** Maps a request URL to the upstream service that owns its first path segment. */
export class ServiceRegistry {
  constructor(services) {
    this.targets = new Map(
      Object.entries(services).map(([name, url]) => {
        const { hostname, host, port, protocol } = new URL(url);
        if (protocol !== 'http:' && protocol !== 'https:') {
          throw new Error(`Unsupported protocol "${protocol}" for service "${name}" (${url}): use http:// or https://`);
        }
        return [name, { name, protocol, hostname, host, port: Number(port) || (protocol === 'https:' ? 443 : 80) }];
      }),
    );
  }

  /**
   * @returns {{ target: object } | { error: 'service_not_found' | 'not_found' }}
   * `/<service>/...` -> target; `/<unknown>/...` -> service_not_found; `/` or `/<single>` of an
   * unknown name -> not_found (same answers as the Python gateway).
   */
  resolve(url) {
    const pathname = url.split('?')[0];
    const segments = pathname.split('/').filter((s, i) => i > 0 || s !== '');
    const name = segments[0];
    if (name && this.targets.has(name)) return { target: this.targets.get(name) };
    if (segments.length >= 2) return { error: 'service_not_found' };
    return { error: 'not_found' };
  }
}
