import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ACCESSIBILITY_INIT_SCRIPT, AccessibilityProvider } from "@/lib/accessibility/accessibility-context";
import { AccessibilityWidget } from "@/components/accessibility/accessibility-widget";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["SOFT", "opsz"],
});

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Nearyx",
  description: "Encuentra tu experto ideal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: ACCESSIBILITY_INIT_SCRIPT }} />
        {process.env.NEXT_PUBLIC_FORCE_MEDELLIN === '1' && (
          <script
            // Fuerza la geolocalización a Medellín, Colombia para todo el frontend
            dangerouslySetInnerHTML={{
              __html: `(() => {
  try {
    const LAT = 6.2442; // Medellín
    const LNG = -75.5812;
    const ACC = 15; // metros (aprox.)

    const watchers = new Map();

    const mkPosition = () => ({
      coords: {
        latitude: LAT,
        longitude: LNG,
        accuracy: ACC,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    });

    const fakeGeo = {
      getCurrentPosition(success, error) {
        try { typeof success === 'function' && success(mkPosition()); }
        catch (e) { typeof error === 'function' && error(e); }
      },
      watchPosition(success, error) {
        const id = Math.floor(Math.random() * 1e9);
        const tick = () => {
          try { typeof success === 'function' && success(mkPosition()); }
          catch (e) { typeof error === 'function' && error(e); }
        };
        tick();
        const interval = setInterval(tick, 15000);
        watchers.set(id, interval);
        return id;
      },
      clearWatch(id) {
        const i = watchers.get(id);
        if (i) { clearInterval(i); watchers.delete(id); }
      },
    };

    const install = () => {
      if (!('geolocation' in navigator)) return;
      try {
        Object.defineProperty(navigator, 'geolocation', {
          value: fakeGeo,
          writable: false,
          configurable: false,
        });
      } catch {
        // fallback si no permite definir la propiedad
        // @ts-ignore
        navigator.geolocation = fakeGeo;
      }
    };

    install();
  } catch {}
})();`,
            }}
          />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <AccessibilityProvider>
          <QueryProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </QueryProvider>
          <AccessibilityWidget />
        </AccessibilityProvider>
      </body>
    </html>
  );
}
