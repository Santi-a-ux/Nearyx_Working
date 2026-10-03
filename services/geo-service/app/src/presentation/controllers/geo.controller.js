import { toGeocodeDto, toReverseGeocodeDto } from '../dtos/geo.dto.js';

export class GeoController {
  constructor(geoService) {
    this.geoService = geoService;
  }

  geocode = async (req, res) => {
    const results = await this.geoService.geocode(req.valid.query.q);
    res.json(results.map(toGeocodeDto));
  };

  reverseGeocode = async (req, res) => {
    const { lat, lng } = req.valid.query;
    res.json(toReverseGeocodeDto(await this.geoService.reverseGeocode(lat, lng)));
  };
}
