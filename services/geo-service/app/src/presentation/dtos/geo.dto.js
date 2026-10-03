export const toGeocodeDto = (r) => ({ display_name: r.displayName, lat: r.lat, lng: r.lng });

export const toReverseGeocodeDto = (r) => ({ display_name: r.displayName, details: r.details });
