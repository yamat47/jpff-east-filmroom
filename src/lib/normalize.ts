/**
 * The form in which a team's spelling is compared: full-width letters, digits and symbols become
 * half-width (NFKC), and runs of whitespace become one space.
 */
export function normalizeSpelling(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, " ").trim();
}
