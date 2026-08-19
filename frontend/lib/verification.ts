export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface EducationItem {
  degree: string;
  institution: string;
  field?: string | null;
  start_year?: number | null;
  end_year?: number | null;
}

export interface CertificationItem {
  name: string;
  issuer?: string | null;
  year?: number | null;
}

export interface ExperienceItem {
  role: string;
  organization?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  description?: string | null;
}

export interface VerificationDocument {
  id?: string;
  file_url: string;
  file_name?: string | null;
  doc_type?: string | null;
}

export interface VerificationRequest {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  summary?: string | null;
  education: EducationItem[];
  certifications: CertificationItem[];
  experience: ExperienceItem[];
  skills: string[];
  review_notes?: string | null;
  reviewed_at?: string | null;
  documents: VerificationDocument[];
  created_at: string;
  updated_at: string;
}

export interface VerificationPublic {
  user_id: string;
  summary?: string | null;
  education: EducationItem[];
  certifications: CertificationItem[];
  experience: ExperienceItem[];
  skills: string[];
  reviewed_at?: string | null;
}

// Mismo patrón que el mapa de estados de reservas en app/(main)/bookings/page.tsx
export const VERIFICATION_STATUS: Record<VerificationStatus, { label: string; className: string }> = {
  unverified: { label: "Sin verificar", className: "bg-muted text-muted-foreground" },
  pending: { label: "Verificación en revisión", className: "bg-semantic-warning/10 text-semantic-warning" },
  verified: { label: "Tutor verificado", className: "bg-semantic-success/10 text-semantic-success" },
  rejected: { label: "Verificación rechazada", className: "bg-semantic-error/10 text-semantic-error" },
};

export function normalizeVerificationStatus(status?: string | null): VerificationStatus {
  return status === "pending" || status === "verified" || status === "rejected" ? status : "unverified";
}

export function isVerified(status?: string | null): boolean {
  return normalizeVerificationStatus(status) === "verified";
}

export function hasPublicVerificationData(data?: VerificationPublic | null): boolean {
  if (!data) return false;
  return (
    (data.education?.length ?? 0) > 0 ||
    (data.certifications?.length ?? 0) > 0 ||
    (data.experience?.length ?? 0) > 0
  );
}

export function formatYearRange(start?: number | null, end?: number | null): string {
  if (start && end) return start + " - " + end;
  if (start) return start + " - Actualidad";
  if (end) return "Hasta " + end;
  return "";
}
