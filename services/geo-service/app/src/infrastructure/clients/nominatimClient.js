import { GeocodeResult } from '../../domain/entities/GeocodeResult.js';
import { ReverseGeocodeResult } from '../../domain/entities/ReverseGeocodeResult.js';
import { UpstreamHttpError } from '../../domain/errors/index.js';

// Like Python's float(): fails loudly on missing / non-numeric values.
function toFloat(value) {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(n)) {
    throw new TypeError(`could not convert ${JSON.stringify(value)} to float`);
  }
  return n;
}

/** OpenStreetMap Nominatim adapter. */
export class NominatimClient {
  constructor({ baseUrl, userAgent, timeoutMs = 5000 }) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;
    this.timeoutMs = timeoutMs;
  }

  async #get(path, params) {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

    const res = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new UpstreamHttpError(res.status);
    return res.json();
  }

  async search(query) {
    const data = await this.#get('/search', { q: query, format: 'json', limit: 5 });
    return data.map(
      (item) =>
        new GeocodeResult({
          displayName: item.display_name ?? '',
          lat: toFloat(item.lat),
          lng: toFloat(item.lon),
        }),
    );
  }

  /** Returns null when Nominatim cannot resolve the coordinates. */
  async reverse(lat, lng) {
    const data = await this.#get('/reverse', { lat, lon: lng, format: 'json' });
    if (data && typeof data === 'object' && 'error' in data) return null;
    return new ReverseGeocodeResult({
      displayName: data.display_name ?? '',
      details: data.address ?? {},
    });
  }
}
