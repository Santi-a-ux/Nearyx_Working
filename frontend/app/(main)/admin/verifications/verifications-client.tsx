"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/user-avatar";
import { appCardClass, appCardInnerClass } from "@/lib/surface-styles";
import { formatYearRange, type VerificationRequest } from "@/lib/verification";
import { cn } from "@/lib/utils";

type RequestStatus = "pending" | "approved" | "rejected";

const FILTERS: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const STATUS_BADGE: Record<RequestStatus, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "bg-semantic-warning/10 text-semantic-warning" },
  approved: { label: "Aprobada", className: "bg-semantic-success/10 text-semantic-success" },
  rejected: { label: "Rechazada", className: "bg-semantic-error/10 text-semantic-error" },
};

interface EnrichedRequest extends VerificationRequest {
  display_name?: string;
  avatar_url?: string;
}

async function fetchRequests(status: RequestStatus): Promise<EnrichedRequest[]> {
  const response = await fetch(`/api/tutors/verification/requests?status=${status}`, {
    credentials: "include",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.detail || "No se pudieron cargar las solicitudes");
  }

  const requests: VerificationRequest[] = data.requests || [];

  // Mismo enriquecimiento N+1 que usa el dashboard para los expertos destacados.
  return Promise.all(
    requests.map(async (request) => {
      try {
        const profileResponse = await fetch(`/api/users/profiles/${request.user_id}`, {
          credentials: "include",
        });
        if (!profileResponse.ok) return request;
        const profile = await profileResponse.json();
        return { ...request, display_name: profile.display_name, avatar_url: profile.avatar_url };
      } catch {
        return request;
      }
    })
  );
}

export default function VerificationsClient() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RequestStatus>("pending");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data: requests = [], isLoading } = useQuery<EnrichedRequest[]>({
    queryKey: ["verification-requests", filter],
    queryFn: () => fetchRequests(filter),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      requestId,
      status,
      reviewNotes,
    }: {
      requestId: string;
      status: "approved" | "rejected";
      reviewNotes?: string;
    }) => {
      const response = await fetch(`/api/tutors/verification/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_notes: reviewNotes || null }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || data.detail || "No se pudo procesar la solicitud");
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["verification-requests"] });
      setRejectingId(null);
      setRejectNotes("");
      toast.success(
        variables.status === "approved" ? "Tutor verificado" : "Solicitud rechazada"
      );
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudo procesar la solicitud");
    },
  });

  const handleReject = (requestId: string) => {
    if (!rejectNotes.trim()) {
      toast.error("Indica el motivo del rechazo para que el tutor pueda corregir.");
      return;
    }
    reviewMutation.mutate({ requestId, status: "rejected", reviewNotes: rejectNotes.trim() });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:py-8">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Administración</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#10314F]">Verificación de tutores</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Revisa la formación, la experiencia y los documentos antes de otorgar la insignia.
        </p>
      </div>

      <div className="mb-6 inline-flex rounded-2xl border border-border bg-white p-1 shadow-sm">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              filter === item.value
                ? "bg-brand-dark text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
      ) : requests.length === 0 ? (
        <div className={`${appCardClass} border-dashed p-8 text-center`}>
          <p className="text-sm text-muted-foreground">
            No hay solicitudes {FILTERS.find((item) => item.value === filter)?.label.toLowerCase()}.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {requests.map((request) => {
            const statusMeta = STATUS_BADGE[request.status];
            const isBusy = reviewMutation.isPending && reviewMutation.variables?.requestId === request.id;

            return (
              <div key={request.id} className={`${appCardClass} p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={request.display_name || "Experto"}
                      size="md"
                      avatarUrl={request.avatar_url}
                    />
                    <div>
                      <p className="text-base font-bold text-[#10314F]">
                        {request.display_name || "Experto sin nombre"}
                      </p>
                      <Link
                        href={`/profile/${request.user_id}`}
                        className="text-caption text-primary hover:underline"
                      >
                        Ver perfil público
                      </Link>
                    </div>
                  </div>
                  <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                </div>

                {request.summary && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                    {request.summary}
                  </p>
                )}

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className={appCardInnerClass}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Formación académica
                    </p>
                    <ul className="mt-3 space-y-2">
                      {request.education.map((item, index) => (
                        <li key={`edu-${index}`} className="text-sm text-foreground/80">
                          <span className="font-semibold text-[#10314F]">{item.degree}</span> ·{" "}
                          {item.institution}
                          {formatYearRange(item.start_year, item.end_year) && (
                            <span className="text-muted-foreground">
                              {" "}
                              ({formatYearRange(item.start_year, item.end_year)})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className={appCardInnerClass}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Certificaciones
                    </p>
                    {request.certifications.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {request.certifications.map((item, index) => (
                          <li key={`cert-${index}`} className="text-sm text-foreground/80">
                            <span className="font-semibold text-[#10314F]">{item.name}</span>
                            {item.issuer && ` · ${item.issuer}`}
                            {item.year && <span className="text-muted-foreground"> ({item.year})</span>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Sin certificaciones registradas.</p>
                    )}
                  </div>

                  <div className={appCardInnerClass}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Experiencia
                    </p>
                    {request.experience.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {request.experience.map((item, index) => (
                          <li key={`exp-${index}`} className="text-sm text-foreground/80">
                            <span className="font-semibold text-[#10314F]">{item.role}</span>
                            {item.organization && ` · ${item.organization}`}
                            {formatYearRange(item.start_year, item.end_year) && (
                              <span className="text-muted-foreground">
                                {" "}
                                ({formatYearRange(item.start_year, item.end_year)})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Sin experiencia registrada.</p>
                    )}
                  </div>

                  <div className={appCardInnerClass}>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Documentos de respaldo
                    </p>
                    {request.documents.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {request.documents.map((document, index) => (
                          <li key={document.id || `doc-${index}`}>
                            <a
                              href={document.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                              <FileText className="h-4 w-4 shrink-0" />
                              <span className="truncate">{document.file_name || "Documento"}</span>
                              {document.doc_type && (
                                <span className="shrink-0 text-caption text-muted-foreground">
                                  ({document.doc_type})
                                </span>
                              )}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">Sin documentos adjuntos.</p>
                    )}
                  </div>
                </div>

                {request.skills.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {request.skills.map((skill, index) => (
                      <Badge
                        key={`${skill}-${index}`}
                        variant="secondary"
                        className="rounded-full border border-[#2563EB]/20 bg-[#EEF6FF] px-3 py-1 text-[#2563EB]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {request.status === "rejected" && request.review_notes && (
                  <div className="mt-5 rounded-xl border border-semantic-error/30 bg-semantic-error/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-semantic-error">
                      Motivo del rechazo
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                      {request.review_notes}
                    </p>
                  </div>
                )}

                {request.status === "pending" && (
                  <div className="mt-6 border-t border-border pt-5">
                    {rejectingId === request.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={rejectNotes}
                          onChange={(event) => setRejectNotes(event.target.value)}
                          placeholder="Explica qué información falta o no se pudo validar."
                          className="min-h-24 resize-none rounded-xl border-border bg-[#F8FBFF]"
                        />
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="destructive"
                            className="rounded-xl"
                            disabled={isBusy}
                            onClick={() => handleReject(request.id)}
                          >
                            {isBusy ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="mr-2 h-4 w-4" />
                            )}
                            Confirmar rechazo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            disabled={isBusy}
                            onClick={() => {
                              setRejectingId(null);
                              setRejectNotes("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Button
                          type="button"
                          className="rounded-xl bg-brand-dark text-white hover:bg-brand-dark/90"
                          disabled={isBusy}
                          onClick={() =>
                            reviewMutation.mutate({ requestId: request.id, status: "approved" })
                          }
                        >
                          {isBusy ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                          )}
                          Aprobar y verificar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-semantic-error/30 text-semantic-error hover:bg-semantic-error/10"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectingId(request.id);
                            setRejectNotes("");
                          }}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
