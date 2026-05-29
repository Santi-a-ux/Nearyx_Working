import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import ExploreClient from "./explore-client";

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 flex h-full flex-col">
          <div className="space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-5 w-96" />
          </div>
          <Skeleton className="min-h-125 w-full rounded-lg" />
        </div>
      }
    >
      <ExploreClient />
    </Suspense>
  );
}
