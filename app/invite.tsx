import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../lib/contexts/FamilyContext';
import { useTheme } from '../lib/contexts/ThemeContext';
import { useAuth } from '../lib/hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function InviteScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { acceptInvitation } = useFamily();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchInvitationDetails();
    } else {
      setError('No invitation token provided');
      setLoading(false);
    }
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('family_invitations')
        .select(`
          *,
          family_accounts (
            name
          ),
          user_profiles!invited_by (
            display_name,
            full_name
          )
        `)
        .eq('invitation_token', token)
        .eq('status', 'pending')
        .single();

      if (error) {
        console.error('Error fetching invitation:', error);
        setError('Invalid or expired invitation');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Invitation not found');
        setLoading(false);
        return;
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        setError('This invitation has expired');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'You need to sign in to accept this invitation. Would you like to sign in now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/signin' as any) }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation(token);
      
      Alert.alert(
        'Success!',
        `You've successfully joined ${invitation.family_accounts.name}!`,
        [
          {
            text: 'Go to App',
            onPress: () => router.push('/(tabs)' as any)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', error.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvitation = () => {
    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setError('Invitation declined');
            setLoading(false);
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading invitation...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>
            Invitation Error
          </Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)' as any)}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              Go to App
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const inviterName = invitation.user_profiles?.display_name || 
                     invitation.user_profiles?.full_name || 
                     'A family member';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="people" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            You're Invited!
          </Text>
        </View>

        {/* Invitation Card */}
        <View style={[styles.invitationCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.familyName, { color: colors.text }]}>
            {invitation.family_accounts.name}
          </Text>
          
          <Text style={[styles.invitationText, { color: colors.textSecondary }]}>
            <Text style={{ fontWeight: '600' }}>{inviterName}</Text> has invited you to join their family account on OrderlyFlow.
          </Text>

          <View style={[styles.benefitsContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.benefitsTitle, { color: colors.text }]}>
              What you'll be able to do:
            </Text>
            <View style={styles.benefitsList}>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  View and manage family tasks
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Access home information and inventory
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Coordinate with family members
                </Text>
              </View>
              <View style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  Manage vendor contacts
                </Text>
              </View>
            </View>
          </View>

          <Text style={[styles.expiryText, { color: colors.textTertiary }]}>
            This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.acceptButton,
              { 
                backgroundColor: loading ? colors.textSecondary : colors.primary,
                opacity: loading ? 0.6 : 1
              }
            ]}
            onPress={handleAcceptInvitation}
            disabled={loading}
          >
            <Ionicons name="checkmark" size={20} color={colors.background} />
            <Text style={[styles.acceptButtonText, { color: colors.background }]}>
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.border }]}
            onPress={handleDeclineInvitation}
            disabled={loading}
          >
            <Text style={[styles.declineButtonText, { color: colors.text }]}>
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  invitationCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  familyName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  invitationText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  benefitsContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  expiryText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  buttonContainer: {
    gap: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  declineButton: {
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 