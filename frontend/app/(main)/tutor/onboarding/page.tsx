"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TutorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    hourly_rate: "",
    subjects: "",
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationCaptured(true);
        toast.success("Ubicación capturada correctamente");
      },
      () => {
        toast.error("No se pudo obtener tu ubicación");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!locationCaptured || !locationCoords) {
      toast.error("Primero captura tu ubicación para poder mostrarte en el mapa.");
      return;
    }

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        specialties: formData.subjects ? formData.subjects.split(",").map((subject) => subject.trim()) : [],
        categories: [],
        hourly_rate: Number(formData.hourly_rate) || null,
        lat: locationCoords.lat,
        lng: locationCoords.lng,
      };

      const response = await fetch("/api/tutors/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          toast.error(data.error || "Sesión expirada. Vuelve a iniciar sesión.");
          router.replace("/login");
          return;
        }

        throw new Error(data.detail || data.error || "Error al crear el perfil de tutor.");
      }

      toast.success("Perfil de tutor creado exitosamente");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el perfil de tutor.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-stretch gap-6 px-4 py-6 lg:py-8">
      <aside className="hidden w-[320px] shrink-0 rounded-[28px] border border-border bg-brand-dark p-6 text-white shadow-sm lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/55">Onboarding de tutor</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Crea tu perfil</h1>
          <p className="mt-4 text-sm leading-6 text-white/75">Completa tus datos básicos para aparecer en la búsqueda, recibir mensajes y mostrar tus precios.</p>
        </div>

        <div className="space-y-3">
          {[
            "Cuenta tu experiencia",
            "Define materias y tarifa",
            "Revisa y publica",
          ].map((item, index) => (
            <div key={item} className={`rounded-2xl border px-4 py-3 ${step >= index + 1 ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5"}`}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Paso {index + 1}</p>
              <p className="mt-1 text-sm font-semibold text-white">{item}</p>
            </div>
          ))}
        </div>
      </aside>

      <Card className="flex-1 rounded-[28px] border-border bg-white shadow-sm">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Paso {step} de 3</p>
              <CardTitle className="mt-2 text-2xl text-foreground">Completa tu perfil de tutor</CardTitle>
              <CardDescription className="mt-2 text-muted-foreground">
                {step === 1 && "Cuéntanos quién eres y captura tu ubicación."}
                {step === 2 && "Agrega materias y define tu tarifa por hora."}
                {step === 3 && "Revisa la información antes de publicar."}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((item) => (
                <span key={item} className={`h-2 w-10 rounded-full ${step >= item ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 lg:p-8">
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-foreground">Biografía profesional</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Soy tutor de matemáticas con experiencia en bachillerato y universidad..."
                  className="min-h-32 rounded-2xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>

              <div className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-brand-soft p-2 text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Label className="text-foreground">Ubicación</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Usa tu ubicación actual para aparecer en búsquedas cercanas.</p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGetLocation}
                      className="mt-4 rounded-xl border-border bg-white px-4 text-foreground hover:bg-background"
                    >
                      {locationCaptured ? "Ubicación capturada" : "Usar mi ubicación actual"}
                    </Button>
                    {locationCaptured && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        Coordenadas guardadas: {locationCoords?.lat.toFixed(4)}, {locationCoords?.lng.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-5">
              <div className="space-y-2">
                <Label htmlFor="subjects" className="text-foreground">Materias</Label>
                <Input
                  id="subjects"
                  name="subjects"
                  value={formData.subjects}
                  onChange={handleChange}
                  placeholder="Matemáticas, Física, Programación"
                  className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
                <p className="text-xs text-muted-foreground">Separa cada materia con coma.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-foreground">Tarifa por hora</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  placeholder="15.00"
                  className="h-12 rounded-xl border-border bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 rounded-2xl border border-border bg-background p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Biografía</p>
                <p className="mt-2 text-sm leading-6 text-foreground">{formData.bio || "No especificada"}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Materias</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{formData.subjects || "No especificadas"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Tarifa</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">${formData.hourly_rate || "0"}/hora</p>
                </div>
              </div>
              <div className={`rounded-2xl border p-4 ${locationCaptured ? "border-semantic-success bg-semantic-success/10" : "border-dashed border-border bg-white"}`}>
                <p className="text-sm font-semibold text-foreground">{locationCaptured ? "Ubicación capturada" : "Falta capturar ubicación"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {locationCaptured && locationCoords
                    ? `Lat ${locationCoords.lat.toFixed(4)} · Lng ${locationCoords.lng.toFixed(4)}`
                    : "Debes capturar tu ubicación para mostrarte en el mapa."}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-3 border-t border-border p-6 lg:p-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            disabled={step === 1 || isLoading}
            className="rounded-xl border-border bg-white text-foreground hover:bg-background"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Atrás
          </Button>

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((value) => Math.min(3, value + 1))}
              className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90"
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Confirmar y crear perfil
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
