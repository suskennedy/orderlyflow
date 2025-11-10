import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/contexts/ThemeContext';
import { useAuth } from '../lib/hooks/useAuth';
import { useFamily } from '../lib/hooks/useFamily';

export default function InviteScreen() {
  const { colors } = useTheme();
  const { acceptInvitation } = useFamily();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token: string }>();
  
  const [loading, setLoading] = useState(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (token) {
      // You could fetch invitation details here if needed
      console.log('Invitation token:', token);
      // For now, we'll assume user exists if they're authenticated
      setUserExists(!!user);
      
      // If accessed via web (not in Expo Go), show instructions
      if (typeof window !== 'undefined' && !window.navigator.userAgent.includes('ExpoGo')) {
        Alert.alert(
          'Open in OrderlyFlow App',
          'This invitation link needs to be opened in the OrderlyFlow app. Please open the link in Expo Go or the OrderlyFlow app.',
          [
            { text: 'OK' }
          ]
        );
      }
    }
  }, [token, user]);

  const handleAcceptInvitation = async () => {
    if (!token) {
      Alert.alert('Error', 'Invalid invitation link');
      return;
    }

    // If user is not authenticated, guide them to sign in/sign up
    if (!user) {
      Alert.alert(
        'Account Required',
        userExists ? 
          'Please sign in to your existing account to accept this invitation.' :
          'Please create an account or sign in to accept this invitation.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: userExists ? 'Sign In' : 'Create Account', 
            onPress: () => router.push('/(auth)/signin' as any) 
          }
        ]
      );
      return;
    }

    try {
      setLoading(true);
      await acceptInvitation(token);
      Alert.alert(
        'Success', 
        'You have successfully joined the family account!',
        [
          { 
            text: 'OK', 
            onPress: () => router.replace('/(tabs)/(dashboard)') 
          }
        ]
      );
    } catch (error: any) {
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
            Alert.alert('Invitation Declined', 'You can always accept it later if you change your mind.');
          }
        }
      ]
    );
  };

  const handleSignInSignUp = () => {
    router.push('/(auth)/signin' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Family Invitation</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={[styles.invitationCard, { backgroundColor: colors.surface }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="people" size={64} color={colors.primary} />
          </View>
          
          <Text style={[styles.title, { color: colors.text }]}>
            You are Invited!
          </Text>
          
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Someone has invited you to join their family account on OrderlyFlow.
          </Text>

          <View style={[styles.benefitsContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.benefitsTitle, { color: colors.text }]}>
              What you will be able to do:
            </Text>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                View and manage family tasks
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Access home information and inventory
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Coordinate with family members
              </Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Manage vendor contacts
              </Text>
            </View>
          </View>

          {/* Account Status Notice */}
          {!user && (
            <View style={[styles.accountNotice, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="information-circle" size={20} color={colors.primary} />
              <Text style={[styles.accountNoticeText, { color: colors.primary }]}>
                {userExists ? 
                  'You need to sign in to your existing account to accept this invitation.' :
                  'You need to create an account or sign in to accept this invitation.'
                }
              </Text>
            </View>
          )}

          <View style={styles.buttonContainer}>
            {user ? (
              // User is authenticated - show accept/decline buttons
              <>
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
                  style={[styles.declineButton, { borderColor: colors.textSecondary }]}
                  onPress={handleDeclineInvitation}
                  disabled={loading}
                >
                  <Text style={[styles.declineButtonText, { color: colors.textSecondary }]}>
                    Decline
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              // User is not authenticated - show sign in/sign up button
              <TouchableOpacity
                style={[styles.acceptButton, { backgroundColor: colors.primary }]}
                onPress={handleSignInSignUp}
              >
                <Ionicons name="log-in" size={20} color={colors.background} />
                <Text style={[styles.acceptButtonText, { color: colors.background }]}>
                  {userExists ? 'Sign In to Accept' : 'Create Account to Accept'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  invitationCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  declineButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  accountNoticeText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
  },
}); 