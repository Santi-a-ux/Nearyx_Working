/** Text that represents a tutor profile for its embedding: specialties + categories, comma separated. */
export function buildProfileText(specialties, categories) {
  return [...(specialties ?? []), ...(categories ?? [])]
    .filter(Boolean)
    .join(', ')
    .trim();
}
