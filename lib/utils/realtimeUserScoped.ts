/**
 * For tables scoped by `user_id` (e.g. vendors). DELETE payloads often omit `user_id` on `old`;
 * match by id against rows we already have (same idea as matchesHomeScopedRow for home_id).
 */
export function matchesUserScopedRow(
  userId: string,
  payload: {
    eventType?: string;
    new?: { id?: string; user_id?: string | null } | null;
    old?: { id?: string; user_id?: string | null } | null;
  },
  currentRowIds: string[]
): boolean {
  const newRow = payload.new;
  const oldRow = payload.old;
  if (newRow?.user_id === userId || oldRow?.user_id === userId) return true;
  if (payload.eventType === 'DELETE' && oldRow?.id && currentRowIds.includes(oldRow.id)) return true;
  return false;
}
