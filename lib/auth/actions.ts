import { supabase } from '../supabase';

export async function signUp(email: string, password: string, fullName: string) {
  // Generate additional user metadata
  const userName = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 5);
  const timestamp = new Date().toISOString();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
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
  
  // Create user profile if signup successful
  if (data.user) {
    await createUserProfile(data.user.id, {
      full_name: fullName,
      display_name: userName,
      notification_email: true,
      notification_push: false,
      notification_sms: false,
      theme: 'system',
      calendar_sync_google: false,
      calendar_sync_apple: false,
    });
  }
  
  return data;
}

// Helper function to create a user profile
async function createUserProfile(userId: string, profileData: any) {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error creating user profile:', error.message);
    }
  } catch (error) {
    console.error('Error in createUserProfile:', error);
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
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) throw error;
  return data;
} 