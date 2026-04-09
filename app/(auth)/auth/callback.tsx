import * as Linking from 'expo-linking';
import { router, useRootNavigationState } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { handleAuthCallbackUrl } from '../../../lib/auth/handleAuthCallbackUrl';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';

/**
 * Email confirmation / auth redirect target (`Linking.createURL('auth/callback')`).
 *
 * Stuck spinner fix:
 * - `router.replace` before the root navigator is ready is ignored — wait for `useRootNavigationState().key`.
 * - `getSession()` can run before `setSession` from the deep link finishes — retry + `onAuthStateChange`.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const navigationState = useRootNavigationState();
  const navigatedRef = React.useRef(false);

  const go = React.useCallback((href: string) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace(href as any);
  }, []);

  React.useEffect(() => {
    if (!navigationState?.key) return;

    let alive = true;
    let authListener: { unsubscribe: () => void } | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void (async () => {
        if (!alive || navigatedRef.current || !url) return;
        const result = await handleAuthCallbackUrl(url);
        if (!result.handled || !alive || navigatedRef.current) return;
        go(result.kind === 'recovery' ? '/(auth)/reset-password' : '/(tabs)/(dashboard)');
      })();
    });

    void (async () => {
      const initial = await Linking.getInitialURL();
      if (!alive || navigatedRef.current) return;
      if (initial) {
        const result = await handleAuthCallbackUrl(initial);
        if (!alive || navigatedRef.current) return;
        if (result.handled) {
          go(result.kind === 'recovery' ? '/(auth)/reset-password' : '/(tabs)/(dashboard)');
          return;
        }
      }

      for (const delay of [0, 200, 500, 1200]) {
        if (!alive || navigatedRef.current) return;
        if (delay > 0) {
          await new Promise((r) => setTimeout(r, delay));
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!alive || navigatedRef.current) return;
        if (session?.user) {
          go('/(tabs)/(dashboard)');
          return;
        }
      }

      if (!alive || navigatedRef.current) return;

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (!alive || navigatedRef.current) return;
        if (
          session?.user &&
          (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')
        ) {
          go('/(tabs)/(dashboard)');
        }
      });
      authListener = listener.subscription;

      fallbackTimer = setTimeout(() => {
        if (!alive || navigatedRef.current) return;
        void (async () => {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!alive || navigatedRef.current) return;
          if (session?.user) {
            go('/(tabs)/(dashboard)');
          } else {
            go('/(auth)/signin');
          }
        })();
      }, 2800);
    })();

    return () => {
      alive = false;
      linkingSub.remove();
      authListener?.unsubscribe();
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [navigationState?.key, go]);

  return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
