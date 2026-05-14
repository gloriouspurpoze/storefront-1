/**
 * Team work issue comment body limit — keep in sync with
 * `fixer-backend` `TeamWorkItemService.addComment` (`TEAM_WORK_COMMENT_BODY_MAX_CHARS`).
 *
 * Override for local/dev if backend differs: `REACT_APP_TEAM_WORK_COMMENT_MAX_CHARS`.
 */
function readMaxChars(): number {
  const raw = process.env.REACT_APP_TEAM_WORK_COMMENT_MAX_CHARS
  const n = raw ? Number.parseInt(String(raw), 10) : Number.NaN
  if (Number.isFinite(n) && n >= 1000 && n <= 500_000) {
    return n
  }
  return 32_000
}

export const TEAM_WORK_COMMENT_BODY_MAX_CHARS = readMaxChars()
