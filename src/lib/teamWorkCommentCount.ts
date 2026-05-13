import type { TeamWorkItem } from '../types/teamWork.types'

/** Prefer server `commentCount` when list views omit embedded `comments[]`. */
export function teamWorkCommentCount(item: TeamWorkItem): number {
  const n = item.commentCount
  if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n
  return item.comments?.length ?? 0
}
