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
    console.log('User created successfully, ID:', data.user.id);
    
    // Add a small delay to ensure user is fully created in auth system
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
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

      // Family account will be created manually by user from settings
      console.log('User profile created. Family account can be created from settings.');
    } catch (profileError) {
      console.error('Error creating profile:', profileError);
      // Don't throw here, let the signup complete even if profile creation fails
    }
  }
  
  return data;
}

// Helper function to create a user profile
async function createUserProfile(userId: string, profileData: any) {
  try {
    console.log('Creating user profile for user:', userId);
    
    // First check if user profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingProfile) {
      console.log('User profile already exists for user:', userId);
      return;
    }
    
    // Use insert instead of upsert to avoid foreign key issues
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Error creating user profile:', error.message);
      console.error('Error details:', error);
      throw error;
    } else {
      console.log('User profile created successfully for user:', userId);
    }
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    throw error;
  }
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
  const { data, error } = await supabase.auth.resetPasswordForEmail(email);
  
  if (error) throw error;
  return data;
} 