import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { resetPassword } from '../../../lib/auth/actions';
import { useAuth } from '../../../lib/hooks/useAuth';
import navigate from '../../../lib/navigation';
import Button from '../../ui/Button';
import LoadingScreen from '../../ui/LoadingScreen';
import AuthCard from '../AuthCard';
import AuthContainer from '../AuthContainer';
import AuthHeader from '../AuthHeader';
import FormInput from '../FormInput';
import LinkButton from '../LinkButton';

// Validation function
const validateEmail = (email: string) => {
  if (!email.trim()) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
  return '';
};

export default function ForgotPasswordForm() {
  const { user, loading: authLoading } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate.toDashboard();
    }
  }, [user, authLoading]);

  const handleBlur = () => {
    setTouched(true);
    const error = validateEmail(email);
    setEmailError(error);
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched) {
      const error = validateEmail(text);
      setEmailError(error);
    }
  };

  const validateForm = () => {
    const error = validateEmail(email);
    setEmailError(error);
    setTouched(true);
    return !error;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
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

  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <AuthContainer>
      <AuthHeader 
        title="OrderlyFlow" 
        subtitle={emailSent 
          ? "Check your email for reset instructions" 
          : "Reset your password"
        }
        iconName="lock-closed"
        showBackButton={true}
        backRoute="/(auth)/signin"
      />

      <AuthCard
        title={emailSent ? "Email Sent!" : "Forgot Password?"}
        subtitle={emailSent 
          ? "We've sent password reset instructions to your email address."
          : "Don't worry, we'll help you reset your password."
        }
      >
        {!emailSent && (
          <>
            <FormInput
              label="Email Address"
              iconName="mail-outline"
              placeholder="Enter your email"
              value={email}
              onChangeText={handleEmailChange}
              error={touched ? emailError : ''}
              onBlur={handleBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Button
              title="Send Reset Email"
              onPress={handleResetPassword}
              loading={loading}
              style={styles.resetButton}
            />
          </>
        )}

        <LinkButton
          question=""
          linkText={emailSent ? "Back to Sign In" : "Remember your password? Sign In"}
          onPress={() => navigate.toSignIn()}
          textAlign="center"
        />
      </AuthCard>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  resetButton: {
    marginBottom: 24,
  },
});