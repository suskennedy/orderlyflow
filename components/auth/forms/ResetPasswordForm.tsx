import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { FONTS } from '../../../lib/typography';
import { supabase } from '../../../lib/supabase';
import navigate from '../../../lib/navigation';
import Button from '../../ui/Button';
import AuthCard from '../AuthCard';
import AuthContainer from '../AuthContainer';
import AuthHeader from '../AuthHeader';
import FormInput from '../FormInput';
import LinkButton from '../LinkButton';

const validatePassword = (password: string) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
};

const validateConfirmPassword = (password: string, confirm: string) => {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return '';
};

export default function ResetPasswordForm() {
  const { colors } = useTheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({ newPassword: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });

  const validateForm = () => {
    const newPasswordError = validatePassword(newPassword);
    const confirmPasswordError = validateConfirmPassword(newPassword, confirmPassword);
    setErrors({ newPassword: newPasswordError, confirmPassword: confirmPasswordError });
    setTouched({ newPassword: true, confirmPassword: true });
    return !newPasswordError && !confirmPasswordError;
  };

  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (touched.newPassword) {
      setErrors(prev => ({
        ...prev,
        newPassword: validatePassword(text),
        confirmPassword: touched.confirmPassword
          ? validateConfirmPassword(text, confirmPassword)
          : prev.confirmPassword,
      }));
    }
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (touched.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: validateConfirmPassword(newPassword, text),
      }));
    }
  };

  const handleUpdatePassword = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate.toSignIn(), 2500);
    } catch (error: any) {
      Alert.alert('Error', error?.message ?? 'Unable to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthContainer>
        <AuthHeader
          title="OrderlyFlow"
          subtitle="Your password has been updated"
        />
        <AuthCard>
          <View style={styles.successContainer}>
            <View style={[styles.successIcon, { backgroundColor: colors.success + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Password Updated!</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              Your password has been changed successfully. Redirecting you to sign in…
            </Text>
          </View>
          <LinkButton title="Go to Sign In" onPress={() => navigate.toSignIn()} />
        </AuthCard>
      </AuthContainer>
    );
  }

  return (
    <AuthContainer>
      <AuthHeader
        title="OrderlyFlow"
        subtitle="Create a new password for your account"
      />
      <AuthCard>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Set New Password</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
          Choose a strong password with at least 8 characters.
        </Text>

        <FormInput
          label="New Password"
          placeholder="Enter new password"
          value={newPassword}
          onChangeText={handleNewPasswordChange}
          secureTextEntry
          error={errors.newPassword}
          icon="lock-closed-outline"
        />

        <FormInput
          label="Confirm Password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          secureTextEntry
          error={errors.confirmPassword}
          icon="lock-closed-outline"
        />

        <Button
          title="Update Password"
          onPress={handleUpdatePassword}
          loading={loading}
          style={styles.updateButton}
        />

        <LinkButton title="Back to Sign In" onPress={() => navigate.toSignIn()} />
      </AuthCard>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: FONTS.heading,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 16,
    marginBottom: 24,
  },
  updateButton: {
    marginBottom: 24,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
});
