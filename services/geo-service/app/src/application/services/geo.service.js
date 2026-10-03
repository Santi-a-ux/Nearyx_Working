import {
  CoordinatesNotFoundError,
  UpstreamHttpError,
  UpstreamUnavailableError,
  GeocodingError,
} from '../../domain/errors/index.js';

export class GeoService {
  constructor({ geocoder }) {
    this.geocoder = geocoder;
  }

  /** Address query -> up to 5 candidate coordinates. */
  async geocode(query) {
    try {
      return await this.geocoder.search(query);
    } catch (err) {
      throw new GeocodingError(`Error fetching geocode data: ${err.message}`);
    }
  }

  /** Coordinates -> address details. */
  async reverseGeocode(lat, lng) {
    let result;
    try {
      result = await this.geocoder.reverse(lat, lng);
    } catch (err) {
      if (err instanceof UpstreamHttpError) throw new UpstreamUnavailableError();
      throw new GeocodingError(`Error reading coordinates: ${err.message}`);
    }
    if (!result) throw new CoordinatesNotFoundError();
    return result;
  }
}
