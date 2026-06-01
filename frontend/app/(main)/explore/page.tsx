import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getMapboxAccessToken } from "@/lib/mapbox-env";
import ExploreClient from "./explore-client";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  const mapboxAccessToken = getMapboxAccessToken();

  return (
    <Suspense
      fallback={
        <div className="space-y-6 flex h-full flex-col">
          <div className="space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="min-h-[calc(100vh-10rem)] w-full rounded-lg" />
        </div>
      }
    >
      <ExploreClient mapboxAccessToken={mapboxAccessToken} />
    </Suspense>
  );
}
