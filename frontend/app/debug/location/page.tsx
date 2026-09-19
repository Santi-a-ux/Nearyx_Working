"use client";

import { useEffect, useState } from "react";

type LocationState = {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
};

const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DebugLocationPage() {
  const [status, setStatus] = useState<
    "idle" | "requesting" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [loc, setLoc] = useState<LocationState | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const compute = (coords: GeolocationCoordinates, ts?: number) => {
    const nextLoc: LocationState = {
      lat: coords.latitude,
      lng: coords.longitude,
      accuracy: coords.accuracy,
      timestamp: ts,
    };
    setLoc(nextLoc);
    setDistanceKm(
      haversineKm(nextLoc.lat, nextLoc.lng, MEDELLIN_CENTER.lat, MEDELLIN_CENTER.lng)
    );
  };

  const requestLocation = () => {
    setStatus("requesting");
    setError(null);

    if (!("geolocation" in navigator)) {
      setStatus("error");
      setError("Geolocation no está disponible en este navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        compute(pos.coords, pos.timestamp);
        setStatus("success");
      },
      (err) => {
        setStatus("error");
        setError(err.message || "No se pudo obtener la ubicación.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inMedellin = distanceKm != null ? distanceKm <= 25 : null; // ~25 km radio

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Debug de Ubicación</h1>
      <p className="mt-2 text-sm text-slate-600">
        Este panel solicita tu ubicación al navegador y verifica si estás cerca del centro de Medellín (±25 km).
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Estado</span>
          <span className="text-xs rounded-full border px-2 py-0.5 font-mono">
            {status}
          </span>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-rose-50 p-3 text-sm text-rose-600">
            {error}
          </p>
        )}

        {loc && (
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <span className="font-medium">Tu lat/lng:</span>{" "}
              <span className="font-mono">{loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</span>
            </div>
            {typeof loc.accuracy === "number" && (
              <div>
                <span className="font-medium">Precisión:</span>{" "}
                <span className="font-mono">±{Math.round(loc.accuracy)} m</span>
              </div>
            )}
            {typeof loc.timestamp === "number" && (
              <div>
                <span className="font-medium">Timestamp:</span>{" "}
                <span className="font-mono">{new Date(loc.timestamp).toLocaleString()}</span>
              </div>
            )}
            {typeof distanceKm === "number" && (
              <div>
                <span className="font-medium">Distancia a Medellín:</span>{" "}
                <span className="font-mono">{distanceKm.toFixed(2)} km</span>
              </div>
            )}
            {inMedellin !== null && (
              <div className="mt-2">
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${inMedellin ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" : "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20"}`}>
                  {inMedellin ? "Estás en Medellín (≈)" : "Estás fuera de Medellín (≈)"}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4">
          <button
            type="button"
            onClick={requestLocation}
            className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            Volver a solicitar ubicación
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          Centro de referencia: <span className="font-mono">{MEDELLIN_CENTER.lat}, {MEDELLIN_CENTER.lng}</span>
        </p>
        <p className="mt-1">
          Si no ves nada, revisa permisos del navegador para esta página.
        </p>
      </div>
    </div>
  );
}
