export type FeedAuthorRole = "Experto" | "Estudiante";

export function mapSessionRoleToFeedAuthorRole(role?: string | null): FeedAuthorRole | undefined {
  if (!role) return undefined;
  const normalized = role.toLowerCase();
  if (normalized === "tutor" || normalized === "experto") return "Experto";
  if (normalized === "student" || normalized === "estudiante") return "Estudiante";
  return undefined;
}

export function isExpertFeedAuthorRole(authorRole?: string | null): boolean {
  if (!authorRole) return false;
  const normalized = authorRole.toLowerCase();
  return normalized === "experto" || normalized === "tutor";
}
