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
  { user_id: "demo-1", display_name: "Dra. Elena Ríos", specialties: ["Estadística"], lng: -75.568, lat: 5.062 },
  { user_id: "demo-2", display_name: "Prof. Ada Quintero", specialties: ["Diseño"], lng: -75.551, lat: 5.048 },
  { user_id: "demo-3", display_name: "Iván Soto", specialties: ["React"], lng: -75.582, lat: 5.055 },
  { user_id: "demo-4", display_name: "Lara Méndez", specialties: ["Economía"], lng: -75.539, lat: 5.071 },
];
