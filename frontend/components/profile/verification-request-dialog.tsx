"use client";

import { useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Loader2, Plus, Trash2 } from "lucide-react";
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
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  VerificationDocument,
  VerificationRequest,
} from "@/lib/verification";

const STEP_LABELS = [
  "Registra tu formación académica y dónde estudiaste.",
  "Agrega especializaciones, cursos y certificaciones.",
  "Cuéntanos tu experiencia y las habilidades que ofreces.",
  "Carga los documentos que respaldan tu información y revisa antes de enviar.",
];

const DOC_TYPES = [
  { value: "diploma", label: "Diploma o título" },
  { value: "certificado", label: "Certificado o curso" },
  { value: "identidad", label: "Documento de identidad" },
  { value: "otro", label: "Otro" },
];

const FIELD_CLASS = "h-11 rounded-xl border-border bg-[#F8FBFF]";
const ROW_CLASS = "space-y-3 rounded-xl border border-border bg-[#F8FBFF] p-4";

interface EducationDraft {
  degree: string;
  institution: string;
  field: string;
  start_year: string;
  end_year: string;
}

interface CertificationDraft {
  name: string;
  issuer: string;
  year: string;
}

interface ExperienceDraft {
  role: string;
  organization: string;
  start_year: string;
  end_year: string;
  description: string;
}

const emptyEducation = (): EducationDraft => ({
  degree: "",
  institution: "",
  field: "",
  start_year: "",
  end_year: "",
});

const emptyCertification = (): CertificationDraft => ({ name: "", issuer: "", year: "" });

const emptyExperience = (): ExperienceDraft => ({
  role: "",
  organization: "",
  start_year: "",
  end_year: "",
  description: "",
});

const toYear = (value: string): number | null => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

function toDrafts<S, T>(source: S[] | undefined, map: (item: S) => T, fallback: T[]): T[] {
  if (!source || source.length === 0) return fallback;
  return source.map(map);
}

const yearToText = (year?: number | null) => (year ? String(year) : "");

interface VerificationRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Solicitud rechazada previa: se usa para precargar el formulario al reenviar. */
  previousRequest?: VerificationRequest | null;
}

export function VerificationRequestDialog({
  open,
  onOpenChange,
  previousRequest,
}: VerificationRequestDialogProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [summary, setSummary] = useState(previousRequest?.summary || "");
  const [education, setEducation] = useState<EducationDraft[]>(
    toDrafts<EducationItem, EducationDraft>(
      previousRequest?.education,
      (item) => ({
        degree: item.degree || "",
        institution: item.institution || "",
        field: item.field || "",
        start_year: yearToText(item.start_year),
        end_year: yearToText(item.end_year),
      }),
      [emptyEducation()]
    )
  );
  const [certifications, setCertifications] = useState<CertificationDraft[]>(
    toDrafts<CertificationItem, CertificationDraft>(
      previousRequest?.certifications,
      (item) => ({
        name: item.name || "",
        issuer: item.issuer || "",
        year: yearToText(item.year),
      }),
      []
    )
  );
  const [experience, setExperience] = useState<ExperienceDraft[]>(
    toDrafts<ExperienceItem, ExperienceDraft>(
      previousRequest?.experience,
      (item) => ({
        role: item.role || "",
        organization: item.organization || "",
        start_year: yearToText(item.start_year),
        end_year: yearToText(item.end_year),
        description: item.description || "",
      }),
      []
    )
  );
  const [skills, setSkills] = useState((previousRequest?.skills || []).join(", "));
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);

  const validEducation = education.filter((item) => item.degree.trim() && item.institution.trim());
  const canSubmit = validEducation.length > 0 && documents.length > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && (isLoading || uploading)) return;
    onOpenChange(nextOpen);
    if (!nextOpen) setStep(1);
  };

  const updateAt = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number, patch: Partial<T>) => {
    setter((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeAt = <T,>(setter: Dispatch<SetStateAction<T[]>>, index: number) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);

        const res = await fetch("/api/tutors/verification/documents", {
          method: "POST",
          credentials: "include",
          body,
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || data.detail || `No se pudo subir ${file.name}`);
        }

        setDocuments((prev) => [
          ...prev,
          { file_url: data.file_url, file_name: data.file_name || file.name, doc_type: "certificado" },
        ]);
      }

      toast.success(files.length === 1 ? "Documento cargado" : "Documentos cargados");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error subiendo el documento");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error("Agrega al menos un título académico y un documento de respaldo.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        summary: summary.trim() || null,
        education: validEducation.map((item) => ({
          degree: item.degree.trim(),
          institution: item.institution.trim(),
          field: item.field.trim() || null,
          start_year: toYear(item.start_year),
          end_year: toYear(item.end_year),
        })),
        certifications: certifications
          .filter((item) => item.name.trim())
          .map((item) => ({
            name: item.name.trim(),
            issuer: item.issuer.trim() || null,
            year: toYear(item.year),
          })),
        experience: experience
          .filter((item) => item.role.trim())
          .map((item) => ({
            role: item.role.trim(),
            organization: item.organization.trim() || null,
            start_year: toYear(item.start_year),
            end_year: toYear(item.end_year),
            description: item.description.trim() || null,
          })),
        skills: skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        documents,
      };

      const response = await fetch("/api/tutors/verification", {
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
        throw new Error(data.detail || data.error || "No se pudo enviar la solicitud.");
      }

      toast.success("Solicitud enviada. Te avisaremos cuando sea revisada.");
      handleOpenChange(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar la solicitud.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[min(92vh,820px)] w-[min(92vw,680px)] max-w-[680px] flex-col gap-0 overflow-hidden border border-[#95C9FC] bg-white p-0 shadow-[0_32px_80px_rgba(15,23,42,0.18)] sm:max-w-[680px]"
      >
        <DialogHeader className="shrink-0 border-b border-[#95C9FC] bg-[#C6E2FE] px-5 py-4 text-left">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#10314f]/70">
            Paso {step} de 4
          </p>
          <DialogTitle className="mt-1 text-lg font-semibold text-[#10314f]">
            Solicitud de verificación
          </DialogTitle>
          <DialogDescription className="text-[#10314f]/75">{STEP_LABELS[step - 1]}</DialogDescription>
          <div className="mt-3 flex items-center gap-2">
            {[1, 2, 3, 4].map((item) => (
              <span
                key={item}
                className={`h-1.5 flex-1 rounded-full ${step >= item ? "bg-primary" : "bg-[#10314f]/15"}`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {step === 1 && (
            <div className="space-y-4">
              {education.map((item, index) => (
                <div key={index} className={ROW_CLASS}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Título {index + 1}
                    </p>
                    {education.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeAt(setEducation, index)}
                        aria-label="Quitar título"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`degree-${index}`}>Título obtenido</Label>
                    <Input
                      id={`degree-${index}`}
                      value={item.degree}
                      onChange={(e) => updateAt(setEducation, index, { degree: e.target.value })}
                      placeholder="Ingeniería de Sistemas"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`institution-${index}`}>Institución donde estudiaste</Label>
                    <Input
                      id={`institution-${index}`}
                      value={item.institution}
                      onChange={(e) => updateAt(setEducation, index, { institution: e.target.value })}
                      placeholder="Universidad de Antioquia"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`field-${index}`}>Área o especialización</Label>
                    <Input
                      id={`field-${index}`}
                      value={item.field}
                      onChange={(e) => updateAt(setEducation, index, { field: e.target.value })}
                      placeholder="Desarrollo de software"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`edu-start-${index}`}>Año de inicio</Label>
                      <Input
                        id={`edu-start-${index}`}
                        type="number"
                        min="1900"
                        max="2100"
                        value={item.start_year}
                        onChange={(e) => updateAt(setEducation, index, { start_year: e.target.value })}
                        placeholder="2016"
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-end-${index}`}>Año de grado</Label>
                      <Input
                        id={`edu-end-${index}`}
                        type="number"
                        min="1900"
                        max="2100"
                        value={item.end_year}
                        onChange={(e) => updateAt(setEducation, index, { end_year: e.target.value })}
                        placeholder="2021"
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-dashed"
                onClick={() => setEducation((prev) => [...prev, emptyEducation()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir otro título
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {certifications.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aún no has agregado certificaciones. Este paso es opcional, pero fortalece tu solicitud.
                </p>
              )}

              {certifications.map((item, index) => (
                <div key={index} className={ROW_CLASS}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Certificación {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeAt(setCertifications, index)}
                      aria-label="Quitar certificación"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`cert-name-${index}`}>Nombre del curso o certificación</Label>
                    <Input
                      id={`cert-name-${index}`}
                      value={item.name}
                      onChange={(e) => updateAt(setCertifications, index, { name: e.target.value })}
                      placeholder="Especialización en Ciencia de Datos"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`cert-issuer-${index}`}>Entidad que lo emitió</Label>
                      <Input
                        id={`cert-issuer-${index}`}
                        value={item.issuer}
                        onChange={(e) => updateAt(setCertifications, index, { issuer: e.target.value })}
                        placeholder="Coursera"
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`cert-year-${index}`}>Año</Label>
                      <Input
                        id={`cert-year-${index}`}
                        type="number"
                        min="1900"
                        max="2100"
                        value={item.year}
                        onChange={(e) => updateAt(setCertifications, index, { year: e.target.value })}
                        placeholder="2023"
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-dashed"
                onClick={() => setCertifications((prev) => [...prev, emptyCertification()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir certificación o curso
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              {experience.map((item, index) => (
                <div key={index} className={ROW_CLASS}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Experiencia {index + 1}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeAt(setExperience, index)}
                      aria-label="Quitar experiencia"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`exp-role-${index}`}>Cargo o rol</Label>
                    <Input
                      id={`exp-role-${index}`}
                      value={item.role}
                      onChange={(e) => updateAt(setExperience, index, { role: e.target.value })}
                      placeholder="Docente de matemáticas"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`exp-org-${index}`}>Organización</Label>
                    <Input
                      id={`exp-org-${index}`}
                      value={item.organization}
                      onChange={(e) => updateAt(setExperience, index, { organization: e.target.value })}
                      placeholder="Colegio San José"
                      className={FIELD_CLASS}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`exp-start-${index}`}>Desde</Label>
                      <Input
                        id={`exp-start-${index}`}
                        type="number"
                        min="1900"
                        max="2100"
                        value={item.start_year}
                        onChange={(e) => updateAt(setExperience, index, { start_year: e.target.value })}
                        placeholder="2019"
                        className={FIELD_CLASS}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exp-end-${index}`}>Hasta</Label>
                      <Input
                        id={`exp-end-${index}`}
                        type="number"
                        min="1900"
                        max="2100"
                        value={item.end_year}
                        onChange={(e) => updateAt(setExperience, index, { end_year: e.target.value })}
                        placeholder="Vacío si continúas"
                        className={FIELD_CLASS}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`exp-desc-${index}`}>Descripción</Label>
                    <Textarea
                      id={`exp-desc-${index}`}
                      value={item.description}
                      onChange={(e) => updateAt(setExperience, index, { description: e.target.value })}
                      placeholder="Qué hacías y con qué tipo de estudiantes trabajabas."
                      className="min-h-20 resize-none rounded-xl border-border bg-white"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl border-dashed"
                onClick={() => setExperience((prev) => [...prev, emptyExperience()])}
              >
                <Plus className="mr-2 h-4 w-4" />
                Añadir experiencia
              </Button>

              <div className="space-y-2">
                <Label htmlFor="verification-skills">Habilidades que ofreces</Label>
                <Input
                  id="verification-skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Álgebra, Cálculo, Estadística"
                  className={FIELD_CLASS}
                />
                <p className="text-xs text-muted-foreground">Separa cada habilidad con coma.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="verification-summary">Resumen profesional</Label>
                <Textarea
                  id="verification-summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Un párrafo corto sobre tu trayectoria."
                  className="min-h-24 resize-none rounded-xl border-border bg-[#F8FBFF]"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="verification-docs">Documentos de respaldo</Label>
                <Input
                  id="verification-docs"
                  type="file"
                  multiple
                  accept=".pdf,image/*"
                  onChange={handleFiles}
                  disabled={uploading}
                  className="h-auto border-0 bg-transparent px-0 py-0 text-sm text-foreground shadow-none file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="text-xs text-muted-foreground">
                  Diplomas, actas de grado o certificados en PDF o imagen. Solo los ve el equipo de revisión.
                </p>
                {uploading && <p className="text-xs text-muted-foreground">Subiendo...</p>}
              </div>

              {documents.length > 0 && (
                <ul className="space-y-2">
                  {documents.map((document, index) => (
                    <li
                      key={`${document.file_url}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-[#F8FBFF] p-3"
                    >
                      <FileText className="h-4 w-4 shrink-0 text-[#2563EB]" />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {document.file_name || "Documento"}
                      </span>
                      <select
                        value={document.doc_type || "certificado"}
                        onChange={(e) =>
                          setDocuments((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, doc_type: e.target.value } : item))
                          )
                        }
                        className="h-8 shrink-0 rounded-lg border border-border bg-white px-2 text-xs text-foreground"
                      >
                        {DOC_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== index))}
                        aria-label="Quitar documento"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="space-y-3 rounded-xl border border-border bg-[#F8FBFF] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  Resumen de tu solicitud
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Formación</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {validEducation.length} {validEducation.length === 1 ? "título" : "títulos"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Certificaciones</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {certifications.filter((item) => item.name.trim()).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Experiencia</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {experience.filter((item) => item.role.trim()).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Documentos</p>
                    <p className="mt-1 text-sm font-semibold text-foreground">{documents.length}</p>
                  </div>
                </div>
                {!canSubmit && (
                  <p className="text-sm text-semantic-error">
                    Necesitas al menos un título con institución y un documento de respaldo.
                  </p>
                )}
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

          {step < 4 ? (
            <Button
              type="button"
              variant="default"
              onClick={() => setStep((value) => Math.min(4, value + 1))}
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
              disabled={isLoading || uploading || !canSubmit}
              className="rounded-xl bg-[#0f172a] text-white hover:bg-[#172554]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Enviar solicitud
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
