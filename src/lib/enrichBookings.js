import { supabase } from './supabase';

/**
 * `bookings.user_id` references `auth.users`, not `profiles`, so PostgREST cannot embed `profiles(*)`.
 * `mechanics` embed can fail for users depending on RLS — a follow-up select avoids that.
 */
export async function enrichBookings(bookings, { profiles = false, mechanics = false } = {}) {
  if (!bookings?.length) return bookings ?? [];

  if (profiles) {
    const userIds = [...new Set(bookings.map((b) => b.user_id).filter(Boolean))];
    if (userIds.length) {
      const { data, error } = await supabase.from('profiles').select('*').in('id', userIds);
      if (error) throw error;
      const map = Object.fromEntries((data || []).map((p) => [p.id, p]));
      for (const row of bookings) {
        row.profiles = map[row.user_id] ?? null;
      }
    }
  }

  if (mechanics) {
    const mids = [...new Set(bookings.map((b) => b.mechanic_id).filter(Boolean))];
    if (mids.length) {
      const { data, error } = await supabase.from('mechanics').select('id, name').in('id', mids);
      if (error) throw error;
      const map = Object.fromEntries((data || []).map((m) => [m.id, m]));
      for (const row of bookings) {
        row.mechanics = row.mechanic_id ? map[row.mechanic_id] ?? null : null;
      }
    }
  }

  return bookings;
}
