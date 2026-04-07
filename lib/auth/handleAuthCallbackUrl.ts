import * as Linking from 'expo-linking';
import { supabase } from '../supabase';

/** Use this for Supabase `emailRedirectTo` / Dashboard redirect allow-list (exact URL). */
export function getEmailConfirmationRedirectUrl(): string {
  return Linking.createURL('auth/callback');
}

/**
 * Parses Supabase auth redirect URLs (tokens in hash or query) and establishes a session.
 * Returns whether this URL was an auth callback and what flow it was.
 */
export async function handleAuthCallbackUrl(
  url: string,
): Promise<{ handled: boolean; kind?: 'recovery' | 'signup' }> {
  if (!url) return { handled: false };

  const hasToken =
    url.includes('access_token') ||
    url.includes('refresh_token') ||
    url.includes('code=');
  if (!hasToken) return { handled: false };

  const fragment = url.split('#')[1];
  const queryPart = url.includes('?') ? url.split('?')[1]?.split('#')[0] : '';
  const fromHash = fragment ? new URLSearchParams(fragment) : null;
  const fromQuery = queryPart ? new URLSearchParams(queryPart) : null;

  const access_token =
    fromHash?.get('access_token') ?? fromQuery?.get('access_token') ?? undefined;
  const refresh_token =
    fromHash?.get('refresh_token') ?? fromQuery?.get('refresh_token') ?? undefined;
  const type = (fromHash?.get('type') ?? fromQuery?.get('type') ?? '').toLowerCase();

  if (access_token && refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) {
      console.error('[auth] setSession from deep link failed:', error.message);
      return { handled: false };
    }

    if (type === 'recovery' || url.includes('reset-password')) {
      return { handled: true, kind: 'recovery' };
    }
    return { handled: true, kind: 'signup' };
  }

  // PKCE / code exchange (less common for mobile email links; kept for completeness)
  const code = fromQuery?.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth] exchangeCodeForSession failed:', error.message);
      return { handled: false };
    }
    if (type === 'recovery' || url.includes('reset-password')) {
      return { handled: true, kind: 'recovery' };
    }
    return { handled: true, kind: 'signup' };
  }

  return { handled: false };
}
