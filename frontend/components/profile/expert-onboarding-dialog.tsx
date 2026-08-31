"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP } from "@/lib/currency";

const STEP_LABELS = [
  "Cuéntanos quién eres y captura tu ubicación.",
  "Agrega materias y define tu tarifa por hora.",
  "Revisa la información antes de publicar.",
];

interface ExpertOnboardingDialogProps {
  triggerLabel?: string;
  triggerClassName?: string;
}

export function ExpertOnboardingDialog({
  triggerLabel = "Crear perfil de experto",
  triggerClassName = "rounded-xl bg-[#0f172a] px-5 text-white hover:bg-[#172554]",
}: ExpertOnboardingDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [locationCaptured, setLocationCaptured] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    bio: "",
    hourly_rate: "",
    subjects: "",
  });

  useEffect(() => {
    if (searchParams.get("expert") === "1") {
      setOpen(true);
    }
  }, [searchParams]);

  const resetForm = () => {
    setStep(1);
    setIsLoading(false);
    setLocationCaptured(false);
    setLocationCoords(null);
    setFormData({ bio: "", hourly_rate: "", subjects: "" });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      resetForm();
      if (searchParams.get("expert") === "1") {
        router.replace("/profile/me");
      }
    }
  };

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

        throw new Error(data.detail || data.error || "Error al crear el perfil de experto.");
      }

      toast.success("Perfil de experto creado exitosamente");
      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el perfil de experto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button type="button" variant="default" className={triggerClassName} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton
          className="flex max-h-[min(92vh,820px)] w-[min(92vw,640px)] max-w-[640px] flex-col gap-0 overflow-hidden border border-[#95C9FC] bg-white p-0 shadow-[0_32px_80px_rgba(15,23,42,0.18)] sm:max-w-[640px]"
        >
          <DialogHeader className="shrink-0 border-b border-[#95C9FC] bg-[#C6E2FE] px-5 py-4 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#10314f]/70">
              Paso {step} de 3
            </p>
            <DialogTitle className="mt-1 text-lg font-semibold text-[#10314f]">
              Completa tu perfil de experto
            </DialogTitle>
            <DialogDescription className="text-[#10314f]/75">
              {STEP_LABELS[step - 1]}
            </DialogDescription>
            <div className="mt-3 flex items-center gap-2">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={`h-1.5 flex-1 rounded-full ${step >= item ? "bg-primary" : "bg-[#10314f]/15"}`}
                />
              ))}
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="expert-bio">Biografía profesional</Label>
                  <Textarea
                    id="expert-bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Soy experto en matemáticas con experiencia en bachillerato y universidad..."
                    className="min-h-28 resize-none rounded-xl border-border bg-[#F8FBFF]"
                  />
                </div>

                <div className="rounded-xl border border-border bg-[#F8FBFF] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#C6E2FE] p-2 text-[#10314f]">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <Label className="text-foreground">Ubicación</Label>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Usa tu ubicación actual para aparecer en búsquedas cercanas.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGetLocation}
                        className="mt-3 rounded-xl border-border bg-white"
                      >
                        {locationCaptured ? "Ubicación capturada" : "Usar mi ubicación actual"}
                      </Button>
                      {locationCaptured && locationCoords && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Coordenadas: {locationCoords.lat.toFixed(4)}, {locationCoords.lng.toFixed(4)}
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
                  <Label htmlFor="expert-subjects">Materias</Label>
                  <Input
                    id="expert-subjects"
                    name="subjects"
                    value={formData.subjects}
                    onChange={handleChange}
                    placeholder="Matemáticas, Física, Programación"
                    className="h-11 rounded-xl border-border bg-[#F8FBFF]"
                  />
                  <p className="text-xs text-muted-foreground">Separa cada materia con coma.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expert-hourly_rate">Tarifa por hora</Label>
                  <Input
                    id="expert-hourly_rate"
                    name="hourly_rate"
                    type="number"
                    min="0"
                    step="1000"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    placeholder="30000"
                    className="h-11 rounded-xl border-border bg-[#F8FBFF]"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 rounded-xl border border-border bg-[#F8FBFF] p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Biografía</p>
                  <p className="mt-2 text-sm leading-6 text-foreground">{formData.bio || "No especificada"}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Materias</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{formData.subjects || "No especificadas"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Tarifa</p>
                    <p className="mt-2 text-sm leading-6 text-foreground">{formatCOP(formData.hourly_rate || 0)}/hora</p>
                  </div>
                </div>
                <div
                  className={`rounded-xl border p-3 ${
                    locationCaptured
                      ? "border-semantic-success bg-semantic-success/10"
                      : "border-dashed border-border bg-white"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    {locationCaptured ? "Ubicación capturada" : "Falta capturar ubicación"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {locationCaptured && locationCoords
                      ? `Lat ${locationCoords.lat.toFixed(4)} · Lng ${locationCoords.lng.toFixed(4)}`
                      : "Debes capturar tu ubicación para mostrarte en el mapa."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-[#F8FBFF] px-5 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((value) => Math.max(1, value - 1))}
              disabled={step === 1 || isLoading}
              className="rounded-xl"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Atrás
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                variant="default"
                onClick={() => setStep((value) => Math.min(3, value + 1))}
                className="rounded-xl bg-[#0f172a] text-white hover:bg-[#172554]"
              >
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="default"
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl bg-[#0f172a] text-white hover:bg-[#172554]"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                Confirmar y crear perfil
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
