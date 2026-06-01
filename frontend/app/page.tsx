import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LandingHero } from "@/components/landing/landing-hero";
import { SiteNav } from "@/components/layout/site-nav";
import { getMapboxAccessToken } from "@/lib/mapbox-env";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) redirect("/dashboard");

  const mapboxAccessToken = getMapboxAccessToken();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNav />
      <main className="pt-14">
        <LandingHero mapboxAccessToken={mapboxAccessToken} />
      </main>
      <footer className="border-t border-border px-6 py-10 text-center text-caption text-muted-foreground">
        <span className="font-display font-semibold text-foreground">Nearyx</span>
        <span className="mx-2">·</span>
        © 2026 · Medellín, Colombia
      </footer>
    </div>
  );
}
