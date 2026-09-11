export type StudioProviderCandidate = {
  providerId: string;
  providerName: string;
  score: number;
  executable: boolean;
  reason: string;
};

/**
 * Keep the ranked shortlist compact while guaranteeing that Studio's two
 * executable video adapters are preserved when present in the candidate set.
 * This prevents an executable fallback (notably Kie.ai) from disappearing
 * merely because non-executable catalog providers scored higher.
 */
export function studioCandidateShortlist<T extends StudioProviderCandidate>(candidates: T[], limit = 5): T[] {
  const preferredIds = new Set(["runway", "kie-ai"]);
  const mandatory = candidates.filter((candidate) => preferredIds.has(candidate.providerId));
  const remaining = candidates.filter((candidate) => !preferredIds.has(candidate.providerId));
  const selected = [...mandatory, ...remaining].slice(0, Math.max(limit, mandatory.length));
  return selected.sort((a, b) => b.score - a.score);
}
