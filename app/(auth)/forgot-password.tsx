import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Button from '../../components/ui/Button';
import { resetPassword } from '../../lib/auth/actions';
import { useAuth } from '../../lib/hooks/useAuth';
import { navigate } from '../../lib/navigation';

export default function ForgotPassword() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate.toDashboard();
    }
  }, [user, authLoading]);

  const validateEmail = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;

    try {
      setLoading(true);
      
      // Use the server action for password reset
      await resetPassword(email.trim());

      setEmailSent(true);
      Alert.alert(
        'Reset Email Sent',
        'Please check your email for password reset instructions.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigate.toSignIn();
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF2FF" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackToSignIn}
            >
              <Ionicons name="arrow-back" size={24} color="#4F46E5" />
            </TouchableOpacity>
            
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="lock-closed" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.appName}>Reset Password</Text>
            </View>
            <Text style={styles.tagline}>
              {emailSent 
                ? 'Check your email for reset instructions'
                : 'Enter your email to reset your password'
              }
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {emailSent ? 'Email Sent!' : 'Forgot Password?'}
            </Text>
            <Text style={styles.formSubtitle}>
              {emailSent 
                ? 'We\'ve sent password reset instructions to your email address.'
                : 'Don\'t worry, we\'ll help you reset your password.'
              }
            </Text>

            {!emailSent && (
              <>
                {/* Email Input */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                </View>

                {/* Reset Button */}
                <Button
                  title="Send Reset Email"
                  onPress={handleResetPassword}
                  loading={loading}
                  style={styles.resetButton}
                />
              </>
            )}

            {/* Back to Sign In */}
            <TouchableOpacity 
              onPress={handleBackToSignIn}
              style={styles.backToSignInButton}
            >
              <Text style={styles.backToSignInText}>
                {emailSent ? 'Back to Sign In' : 'Remember your password? Sign In'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  resetButton: {
    marginBottom: 24,
  },
  backToSignInButton: {
    alignItems: 'center',
  },
  backToSignInText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '500',
  },
});