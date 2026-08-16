/**
 * Minimal stub. The CodeTrail effect can pause itself during route
 * transitions via this hook; this project has no view-transition router, so
 * it's a no-op that never fires. Kept as a seam in case one is added later.
 */
export function onTransitionChange(
  _cb: (active: boolean) => void
): () => void {
  return () => {};
}
