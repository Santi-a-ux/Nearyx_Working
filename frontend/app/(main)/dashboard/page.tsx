import { Suspense } from "react";

import { getMapboxAccessToken } from "@/lib/mapbox-env";
import { DashboardContent } from "./dashboard-content";

export default function DashboardPage() {
  const mapboxAccessToken = getMapboxAccessToken();

  return (
    <Suspense fallback={null}>
      <DashboardContent mapboxAccessToken={mapboxAccessToken} />
    </Suspense>
  );
}
