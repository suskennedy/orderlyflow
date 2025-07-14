import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { signIn } from '../../../lib/auth/actions';
import { useTheme } from '../../../lib/contexts/ThemeContext';
import { useAuth } from '../../../lib/hooks/useAuth';
import navigate from '../../../lib/navigation';
import Button from '../../ui/Button';
import LoadingScreen from '../../ui/LoadingScreen';
import AuthContainer from '../AuthContainer';
import AuthHeader from '../AuthHeader';
import FormInput from '../FormInput';
import LinkButton from '../LinkButton';


// Validation functions
const validateEmail = (email: string) => {
  if (!email.trim()) return 'Email is required';
  if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email';
  return '';
};

const validatePassword = (password: string) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return '';
};

export default function SignInForm() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email: string; password: string }>({
    email: '',
    password: ''
  });
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false
  });

  // Validate on field blur
  const handleBlur = (field: 'email' | 'password') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'email') {
      setErrors(prev => ({ ...prev, email: validateEmail(email) }));
    } else if (field === 'password') {
      setErrors(prev => ({ ...prev, password: validatePassword(password) }));
    }
  };

  // Validate all fields
  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setErrors({
      email: emailError,
      password: passwordError
    });
    
    setTouched({ email: true, password: true });
    
    return !emailError && !passwordError;
  };

  // Update form fields
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (touched.email) {
      setErrors(prev => ({ ...prev, email: validateEmail(text) }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (touched.password) {
      setErrors(prev => ({ ...prev, password: validatePassword(text) }));
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate.toDashboard();
    }
  }, [user, authLoading]);

  const handleSignIn = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      setErrors({ email: '', password: '' });
      navigate.toDashboard();
    } catch (error: any) {
      const message = error?.message ?? 'Unable to sign in. Please check your credentials and try again.';
      setErrors({ ...errors, password: message });
      Alert.alert('Sign In Error', message);
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
        title="Welcome Back" 
        subtitle="Sign in to your account to continue managing your properties"
      />
      
      <View style={styles.form}>
        <FormInput
          label="Email"
          value={email}
          onChangeText={handleEmailChange}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          icon="mail-outline"
          onBlur={() => handleBlur('email')}
        />
        
        <FormInput
          label="Password"
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="Enter your password"
          secureTextEntry={true}
          error={errors.password}
          icon="lock-closed-outline"
          onBlur={() => handleBlur('password')}
        />
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
        
        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={loading}
          style={styles.signInButton}
        />
        
        <LinkButton
          text="Don't have an account? "
          linkText="Sign up"
          onPress={() => navigate.toSignUp()}
        />
      </View>
    </AuthContainer>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
    marginBottom: 20,
  },
});