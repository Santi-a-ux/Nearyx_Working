// Items are always emitted with every key (null when missing), like the Pydantic models of the Python service.
const education = (i) => ({
  degree: i.degree,
  institution: i.institution,
  field: i.field ?? null,
  start_year: i.start_year ?? null,
  end_year: i.end_year ?? null,
});
const certification = (i) => ({ name: i.name, issuer: i.issuer ?? null, year: i.year ?? null });
const experience = (i) => ({
  role: i.role,
  organization: i.organization ?? null,
  start_year: i.start_year ?? null,
  end_year: i.end_year ?? null,
  description: i.description ?? null,
});

export const toVerificationInput = (b) => ({
  summary: b.summary ?? null,
  education: b.education.map(education),
  certifications: b.certifications.map(certification),
  experience: b.experience.map(experience),
  skills: b.skills,
  documents: b.documents.map((d) => ({ fileUrl: d.file_url, fileName: d.file_name ?? null, docType: d.doc_type ?? null })),
});

const toDocumentDto = (d) => ({
  file_url: d.fileUrl,
  file_name: d.fileName,
  doc_type: d.docType,
  id: d.id,
  created_at: d.createdAt,
});

export const toVerificationDto = ({ request: r, documents }) => ({
  id: r.id,
  user_id: r.userId,
  status: r.status,
  summary: r.summary,
  education: r.education.map(education),
  certifications: r.certifications.map(certification),
  experience: r.experience.map(experience),
  skills: r.skills,
  review_notes: r.reviewNotes,
  reviewed_at: r.reviewedAt,
  documents: documents.map(toDocumentDto),
  created_at: r.createdAt,
  updated_at: r.updatedAt,
});

/** Approved data for the public profile. Never includes documents. */
export const toPublicVerificationDto = (r) => ({
  user_id: r.userId,
  summary: r.summary,
  education: r.education.map(education),
  certifications: r.certifications.map(certification),
  experience: r.experience.map(experience),
  skills: r.skills,
  reviewed_at: r.reviewedAt,
});
