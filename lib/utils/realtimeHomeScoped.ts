/**
 * Supabase realtime DELETE payloads often only include the primary key in `old`,
 * not `home_id`, so filters like `home_id=eq.xxx` still deliver the event but
 * `old.home_id` is missing. Match by id against rows we already have for this home.
 */
export function matchesHomeScopedRow(
  homeId: string,
  payload: {
    eventType?: string;
    new?: { id?: string; home_id?: string | null } | null;
    old?: { id?: string; home_id?: string | null } | null;
  },
  currentRowIds: string[]
): boolean {
  const newRow = payload.new;
  const oldRow = payload.old;
  if (newRow?.home_id === homeId || oldRow?.home_id === homeId) return true;
  if (payload.eventType === 'DELETE' && oldRow?.id && currentRowIds.includes(oldRow.id)) return true;
  return false;
}
