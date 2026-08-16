export interface MapTutorPin {
  user_id: string;
  display_name?: string;
  full_name?: string;
  specialties?: string[];
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}

export function getTutorCoordinates(tutor: MapTutorPin): [number, number] | null {
  const lat = tutor.lat ?? tutor.latitude;
  const lng = tutor.lng ?? tutor.longitude;
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  return [lng, lat];
}

export function tutorsWithCoordinates(tutors: MapTutorPin[]): Array<MapTutorPin & { lng: number; lat: number }> {
  return tutors.flatMap((tutor) => {
    const coords = getTutorCoordinates(tutor);
    if (!coords) return [];
    return [{ ...tutor, lng: coords[0], lat: coords[1] }];
  });
}

/** Pins de demostración (Medellín) cuando la landing no tiene sesión. */
export const DEMO_MAP_TUTORS: Array<MapTutorPin & { lng: number; lat: number }> = [
  { user_id: "demo-1", display_name: "Daniel Rojas", specialties: ["Programación"], lng: -75.563, lat: 6.2517 },
  { user_id: "demo-2", display_name: "Mariana Torres", specialties: ["Inglés"], lng: -75.5678, lat: 6.2482 },
  { user_id: "demo-3", display_name: "Julián Castaño", specialties: ["Música"], lng: -75.5705, lat: 6.2552 },
  { user_id: "demo-4", display_name: "Valentina Pineda", specialties: ["Cocina"], lng: -75.5775, lat: 6.2428 },
];
