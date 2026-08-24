import { Suspense } from "react";
import { redirect } from "next/navigation";

import { fetchApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import VerificationsClient from "./verifications-client";

export const dynamic = "force-dynamic";

interface AuthUser {
  id: string;
  role?: string;
}

export default async function AdminVerificationsPage() {
  const authUser = await fetchApi<AuthUser>("/auth/me").catch(() => null);

  // La cookie ya la valida middleware.ts; aquí filtramos por rol.
  if (authUser?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      }
    >
      <VerificationsClient />
    </Suspense>
  );
}
