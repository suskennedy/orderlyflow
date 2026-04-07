import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { handleAuthCallbackUrl } from '../../../lib/auth/handleAuthCallbackUrl';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';

/**
 * Matches `Linking.createURL('auth/callback')` used as Supabase emailRedirectTo.
 * Root `_layout` usually completes the session first; this screen finishes navigation.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        const result = await handleAuthCallbackUrl(initial);
        if (!cancelled && result.handled) {
          if (result.kind === 'recovery') {
            router.replace('/(auth)/reset-password');
          } else {
            router.replace('/(tabs)/(dashboard)');
          }
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session?.user) {
        router.replace('/(tabs)/(dashboard)');
      } else {
        router.replace('/(auth)/signin');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

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
