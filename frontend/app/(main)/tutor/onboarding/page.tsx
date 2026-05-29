"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TutorOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: "",
    hourly_rate: "",
    subjects: "",
  });

  const [locationCaptured, setLocationCaptured] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lng: number} | null>(null);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationCoords({ 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        });
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
        // backend expects `specialties` (array) and top-level `lat`/`lng`
        specialties: formData.subjects ? formData.subjects.split(",").map((s) => s.trim()) : [],
        categories: [],
        hourly_rate: Number(formData.hourly_rate) || null,
        lat: locationCoords?.lat || null,
        lng: locationCoords?.lng || null,
      };

      const response = await fetch("/api/tutors/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      toast.success("¡Perfil de tutor creado exitosamente!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el perfil de tutor.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl border shadow-none" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(56, 36, 13, 0.28)' }}>
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
              Paso {step} de 3
            </span>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 w-8 rounded-full ${
                    step >= i ? "bg-primary" : "bg-white/10"
                  }`}
                  style={{ backgroundColor: step >= i ? '#C4783A' : 'rgba(56, 36, 13, 0.28)' }}
                />
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>Conviértete en Tutor</CardTitle>
          <CardDescription style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
            {step === 1 && "Cuéntanos sobre ti y tu experiencia."}
            {step === 2 && "Configura tus temas y tarifas."}
            {step === 3 && "Revisa y confirma tu información."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white/60" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Biografía Profesional</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  placeholder="Hola, soy experto en matemáticas con 5 años de experiencia..."
                  style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: '#FFFFFF', color: '#38240D', fontFamily: 'var(--font-main)' }}
                  value={formData.bio}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Ubicación</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: '#FFFFFF', color: '#38240D', fontFamily: 'var(--font-main)' }}
                  onClick={handleGetLocation}
                >
                  {locationCaptured ? "✅ Ubicación capturada" : "📍 Usar mi ubicación actual"}
                </Button>
                {locationCaptured && (
                  <p className="text-center text-xs" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
                    Coordenadas guardadas. Puedes continuar.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="subjects" className="text-white/60" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Materias (separadas por coma)</Label>
                <Input
                  id="subjects"
                  name="subjects"
                  placeholder="Matemáticas, Física, Programación"
                  value={formData.subjects}
                  onChange={handleChange}
                  style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: '#FFFFFF', color: '#38240D', fontFamily: 'var(--font-main)' }}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourly_rate" className="text-white/60" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Tarifa por Hora (USD)</Label>
                <Input
                  id="hourly_rate"
                  name="hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="15.00"
                  value={formData.hourly_rate}
                  onChange={handleChange}
                  style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: '#FFFFFF', color: '#38240D', fontFamily: 'var(--font-main)' }}
                  required
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-3 rounded-xl border p-4" style={{ backgroundColor: 'rgba(56, 36, 13, 0.04)', borderColor: 'rgba(56, 36, 13, 0.28)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>Biografía</p>
                  <p className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>{formData.bio || "No especificada"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>Materias</p>
                  <p className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>{formData.subjects || "No especificadas"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>Tarifa</p>
                  <p className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.70)', fontFamily: 'var(--font-main)' }}>${formData.hourly_rate || "0"}/hora</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between border-t p-6" style={{ borderColor: 'rgba(56, 36, 13, 0.28)' }}>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || isLoading}
            style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: 'rgba(56, 36, 13, 0.08)', color: '#38240D', fontFamily: 'var(--font-main)' }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
          
          {step < 3 ? (
            <Button onClick={handleNext}>
              Siguiente <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Confirmar y Crear Perfil
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}