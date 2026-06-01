"use client";

import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";

import { MapPreview } from "@/components/map/map-preview";
import { SectionHeader } from "@/components/layout/section-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cardElevatedClass } from "@/lib/surface-styles";
import { cn } from "@/lib/utils";

const features = [
  {
    n: "01",
    icon: MapPin,
    title: "Geolocalización",
    body: "Descubre expertos a metros de ti con un mapa en vivo y filtros por especialidad.",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "Perfil verificado",
    body: "Cada experto pasa por verificación académica y de identidad antes de aparecer.",
  },
  {
    n: "03",
    icon: Sparkles,
    title: "Pagos seguros",
    body: "Reserva, paga y libera el pago solo cuando termines la sesión, sin sorpresas.",
  },
] as const;

interface LandingHeroProps {
  mapboxAccessToken: string;
}

export function LandingHero({ mapboxAccessToken }: LandingHeroProps) {
  return (
    <>
      <section className="hero-gradient">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-6 py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:py-32">
          <div>
            <Badge variant="secondary" className="mb-6 rounded-full px-3 py-1">
              <span className="text-label">Plataforma académica · Medellín</span>
            </Badge>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-display-xl">
              Encuentra expertos a la vuelta de la esquina.
            </h1>
            <p className="text-body-lg mt-6 max-w-xl text-muted-foreground">
              Nearyx conecta estudiantes con expertos verificados en su barrio. Clases presenciales,
              asesorías y mentorías — con chat y reservas en un solo lugar.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link href="/register" className={buttonVariants({ variant: "brand", size: "lg" })}>
                Crear cuenta
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#como-funciona" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Cómo funciona
              </a>
            </div>
            <p className="text-caption mt-8 text-muted-foreground">· Expertos verificados · Mapa y mensajes</p>
          </div>

          <MapPreview
            accessToken={mapboxAccessToken}
            useDemoIfEmpty
            className="aspect-[5/4] w-full"
            heightClassName="min-h-[300px] w-full"
            overlayMeta="· vista previa"
          />
        </div>
      </section>

      <section id="como-funciona" className="border-t border-border bg-background">
        <div className="mx-auto max-w-[1200px] px-6 py-24">
          <SectionHeader
            eyebrow="Cómo funciona"
            title="Tres pasos para empezar a aprender cerca de ti."
            className="mb-16 max-w-2xl"
            titleClassName="text-display-lg"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <article key={f.n} className={cn(cardElevatedClass, "p-7")}>
                <div className="font-display text-5xl font-semibold text-primary/25">{f.n}</div>
                <div className="mt-6 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-h2 mt-5">{f.title}</h3>
                <p className="text-body mt-3 text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-[1200px] px-6 py-24 text-center">
          <h2 className="text-display-lg font-display mx-auto max-w-2xl">El conocimiento más cerca de lo que piensas.</h2>
          <p className="text-body-lg mx-auto mt-5 max-w-xl text-muted-foreground">
            Únete gratis y empieza a conectar con expertos en tu zona.
          </p>
          <Link href="/register" className={cn(buttonVariants({ variant: "brand", size: "lg" }), "mt-8 inline-flex gap-2")}>
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 py-16 md:grid-cols-3">
          {[
            { icon: MapPin, title: "Mapa en vivo", desc: "Explora expertos cercanos en /explore." },
            { icon: MessageCircle, title: "Chat directo", desc: "Coordina sin salir de la plataforma." },
            { icon: Sparkles, title: "Comunidad", desc: "Publica y conecta en el feed." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center md:text-left">
              <Icon className="mx-auto h-6 w-6 text-primary md:mx-0" />
              <h3 className="text-h3 mt-3">{title}</h3>
              <p className="text-body mt-1 text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
