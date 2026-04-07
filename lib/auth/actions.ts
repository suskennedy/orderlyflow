import * as Linking from 'expo-linking';
import { supabase } from '../supabase';
import { getEmailConfirmationRedirectUrl } from './handleAuthCallbackUrl';

export async function signUp(email: string, password: string, fullName: string) {
  // Generate additional user metadata
  const userName = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 5);
  const timestamp = new Date().toISOString();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getEmailConfirmationRedirectUrl(),
      data: {
        full_name: fullName,
        user_name: userName,
        created_at: timestamp,
        last_activity: timestamp
      },
    },
  });
  
  console.log('[CLIENT] Auth API response:', data ? 'Data received' : 'No data', 
    error ? `Error: ${error.message}` : 'No error');
    
  if (error) throw error;
  
  // Profile creation is handled automatically by the on_auth_user_created
  // database trigger (SECURITY DEFINER), which avoids RLS timing issues.
  if (data.user) {
    console.log('User created successfully, ID:', data.user.id);
  }
  
  return data;
}

// Helper function to create a family account for new user
async function createFamilyAccountForUser(userId: string, fullName: string) {
  try {
    // Create family account with user's name
    const familyName = `${fullName}'s Family`;
    
    const { data, error } = await supabase.rpc('create_family_account', {
      account_name: familyName
    });
    
    if (error) {
      console.error('Error creating family account:', error.message);
    } else {
      console.log('Family account created successfully for user:', userId);
    }
  } catch (error) {
    console.error('Error in createFamilyAccountForUser:', error);
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
  
  if (error) throw error;
  
  return data;
}

export async function signInWithApple() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
  });
  
  if (error) throw error;
  
  return data;
}

export async function resetPassword(email: string) {
  const redirectTo = Linking.createURL('/(auth)/reset-password');
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) throw error;
  return data;
} 