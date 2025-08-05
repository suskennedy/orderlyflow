import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { signUp } from '../../../lib/auth/actions';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import navigate from '../../../lib/navigation';
import Button from '../../ui/Button';
import LoadingScreen from '../../ui/LoadingScreen';
import AuthCard from '../AuthCard';
import AuthContainer from '../AuthContainer';
import AuthHeader from '../AuthHeader';
import FormInput from '../FormInput';
import LinkButton from '../LinkButton';
import PasswordInput from '../PasswordInput';


// Validation functions
const validateFullName = (name: string) => {
  if (!name.trim()) return 'Full name is required';
  if (name.trim().length < 2) return 'Full name must be at least 2 characters';
  return '';
};

const validateEmail = (email: string) => {
  if (!email.trim()) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
  return '';
};

const validatePassword = (password: string) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/(?=.*[a-z])/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/(?=.*[A-Z])/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/(?=.*\d)/.test(password)) return 'Password must contain at least one number';
  return '';
};

const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUpForm() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key in keyof FormData]: string}>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState<{[key in keyof FormData]: boolean}>({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  // Handle field blur to validate
  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field]);
  };

  // Validate a specific field
  const validateField = (field: keyof FormData, value: string) => {
    let error = '';
    switch (field) {
      case 'fullName':
        error = validateFullName(value);
        break;
      case 'email':
        error = validateEmail(value);
        break;
      case 'password':
        error = validatePassword(value);
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(formData.password, value);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  // Update form fields
  const handleInputChange = (field: keyof FormData, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // If field has been touched, validate it on change
    if (touched[field]) {
      validateField(field, value);
    }
    
    // Special case for confirm password, revalidate when password changes
    if (field === 'password' && touched.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  // Validate the entire form
  const validateForm = () => {
    const fieldErrors = {
      fullName: validateFullName(formData.fullName),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, formData.confirmPassword)
    };
    
    setErrors(fieldErrors);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true
    });
    
    return !Object.values(fieldErrors).some(error => error);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate.toDashboard();
    }
  }, [user, authLoading]);

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      await signUp(
        formData.email.trim(),
        formData.password,
        formData.fullName.trim()
      );

      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => navigate.toSignIn() }]
      );
    } catch (error: any) {
      Alert.alert('Sign Up Error', error?.message ?? 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  const getPasswordStrengthHints = () => {
    const hints = [
      { text: 'At least 8 characters', met: formData.password.length >= 8 },
      { text: 'Contains uppercase letter', met: /[A-Z]/.test(formData.password) },
      { text: 'Contains lowercase letter', met: /[a-z]/.test(formData.password) },
      { text: 'Contains number', met: /\d/.test(formData.password) },
      { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
    ];

    return (
      <View style={styles.passwordHints}>
        {hints.map((hint, index) => (
          <View key={index} style={styles.hintRow}>
            <Ionicons 
              name={hint.met ? 'checkmark-circle' : 'ellipse-outline'} 
              size={16} 
              color={hint.met ? colors.success : colors.textTertiary} 
              style={styles.hintIcon}
            />
            <Text style={[
              styles.hintText,
              { color: colors.textTertiary },
              hint.met && { color: colors.success }
            ]}>
              {hint.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <AuthContainer>
      <AuthHeader 
        title="OrderlyFlow" 
        subtitle="Create your account" 
      />

      <AuthCard>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Get started</Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Create your account to begin</Text>
        
        <FormInput
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.fullName}
          onChangeText={(text) => handleInputChange('fullName', text)}
          error={touched.fullName ? errors.fullName : ''}
          autoCapitalize="words"
        />

        <FormInput
          label="Email"
          placeholder="Enter your email"
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          error={touched.email ? errors.email : ''}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <PasswordInput
          label="Password"
          value={formData.password}
          placeholder="Create a password"
          onChangeText={(text) => handleInputChange('password', text)}
          error={touched.password ? errors.password : ''}
        />
        
        {touched.password && getPasswordStrengthHints()}

        <PasswordInput
          label="Confirm Password"
          value={formData.confirmPassword}
          placeholder="Confirm your password"
          onChangeText={(text) => handleInputChange('confirmPassword', text)}
          error={touched.confirmPassword ? errors.confirmPassword : ''}
        />

        <Button
          title="Create Account"
          onPress={handleSignUp}
          loading={loading}
          style={styles.signUpButton}
        />

        <LinkButton
          title="Already have an account? Sign in"
          onPress={() => navigate.toSignIn()}
        />
      </AuthCard>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  signUpButton: {
    marginBottom: 24,
  },
  passwordHints: {
    marginTop: -12,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hintIcon: {
    marginRight: 8,
  },
  hintText: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
});