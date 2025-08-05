import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { FamilyAccount, FamilyInvitation, FamilyMember } from '../../types/family';
import { useAuth } from '../hooks/useAuth';
import { EmailService } from '../services/emailService';
import { supabase } from '../supabase';

interface FamilyContextType {
  // Family account data
  familyAccount: FamilyAccount | null;
  userRole: FamilyMember | null;
  familyMembers: FamilyMember[];
  
  // Invitations
  invitations: FamilyInvitation[];
  
  // Loading states
  loading: boolean;
  loadingMembers: boolean;
  loadingInvitations: boolean;
  
  // Family account operations
  createFamilyAccount: (name: string) => Promise<void>;
  updateFamilyAccount: (updates: Partial<FamilyAccount>) => Promise<void>;
  
  // Member management
  inviteMember: (email: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
  
  // Refresh operations
  refreshFamilyAccount: () => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

interface FamilyProviderProps {
  children: ReactNode;
}

export const FamilyProvider = ({ children }: FamilyProviderProps) => {
  const { user } = useAuth();
  const [familyAccount, setFamilyAccount] = useState<FamilyAccount | null>(null);
  const [userRole, setUserRole] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Fetch family account data
  const fetchFamilyAccount = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID, clearing family account data');
      setFamilyAccount(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching family account for user:', user.id);
      setLoading(true);
      
      // First check if user has a family_account_id in user_profiles
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('family_account_id')
        .eq('id', user.id)
        .single();

      console.log('User profile data:', userProfile);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      if (userProfile?.family_account_id) {
        console.log('User has family account ID:', userProfile.family_account_id);
        
        // User has a family account, get the details
        const { data: familyData, error: familyError } = await supabase
          .from('family_accounts')
          .select('*')
          .eq('id', userProfile.family_account_id)
          .single();

        console.log('Family account data:', familyData);
        console.log('Family error:', familyError);

        if (familyError) {
          console.error('Error fetching family account:', familyError);
        } else if (familyData) {
          console.log('Setting family account:', familyData);
            setFamilyAccount(familyData as any);
          
          // Get user's role in the family
          const { data: memberData, error: memberError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_account_id', userProfile.family_account_id)
            .eq('user_id', user.id)
            .single();

          console.log('Member data:', memberData);
          console.log('Member error:', memberError);

          if (memberError) {
            console.error('Error fetching family member:', memberError);
          } else if (memberData) {
            console.log('Setting user role:', memberData);
            setUserRole(memberData as any);
          }
        }
      } else {
        console.log('No family account found for user');
        // No family account found
        setUserRole(null);
        setFamilyAccount(null);
      }
    } catch (error) {
      console.error('Error fetching family account:', error);
      setUserRole(null);
      setFamilyAccount(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch family members
  const fetchFamilyMembers = useCallback(async () => {
    if (!familyAccount?.id) {
      setFamilyMembers([]);
      return;
    }

    try {
      setLoadingMembers(true);
      
      // First get family members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_account_id', familyAccount.id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        return;
      }

      // Then get user profiles for each member
      const membersWithProfiles = await Promise.all(
        (membersData || []).map(async (member) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('display_name, full_name, avatar_url')
            .eq('id', member.user_id as string)
            .single();

          return {
            ...member,
            user: profileData || null
          };
        })
      );

      setFamilyMembers(membersWithProfiles as FamilyMember[]);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoadingMembers(false);
    }
  }, [familyAccount?.id]);

  // Fetch invitations
  const fetchInvitations = useCallback(async () => {
    if (!familyAccount?.id) {
      setInvitations([]);
      return;
    }

    try {
      setLoadingInvitations(true);
      
      // First get invitations
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('family_account_id', familyAccount.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('Error fetching invitations:', invitationsError);
        return;
      }

      // Then get user profiles for invited_by
      const invitationsWithProfiles = await Promise.all(
        (invitationsData || []).map(async (invitation) => {
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('display_name, full_name')
            .eq('id', invitation.invited_by as string)
            .single();

          return {
            ...invitation,
            user_profiles: profileData || null
          };
        })
      );

      setInvitations(invitationsWithProfiles as FamilyInvitation[]);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  }, [familyAccount?.id]);

  // Create family account
  const createFamilyAccount = async (name: string) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('Creating family account:', name);
      
      const { data, error } = await supabase.rpc('create_family_account', {
        account_name: name
      });

      if (error) {
        console.error('Database error creating family account:', error);
        throw new Error(error.message || 'Failed to create family account');
      }

      console.log('Family account created successfully:', data);

      // Refresh family account data
      await fetchFamilyAccount();
      
      console.log('Family account data refreshed');
    } catch (error) {
      console.error('Error creating family account:', error);
      throw error;
    }
  };

  // Update family account
  const updateFamilyAccount = async (updates: Partial<FamilyAccount>) => {
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase
        .from('family_accounts')
        .update(updates)
        .eq('id', familyAccount.id);

      if (error) throw error;

      // Refresh family account data
      await fetchFamilyAccount();
    } catch (error) {
      console.error('Error updating family account:', error);
      throw error;
    }
  };

  // Invite member
  const inviteMember = async (email: string) => {
    if (!familyAccount?.id || !user?.id) {
      throw new Error('Family account or user not found');
    }

    try {
      // First create the invitation in the database
      const { data: invitationToken, error: invitationError } = await supabase.rpc('invite_family_member', {
        invitee_email: email
      });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        throw new Error(invitationError.message || 'Failed to create invitation');
      }

      console.log('Invitation created with token:', invitationToken);

      // Get invitation details for email
      const { data: invitationDetails } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .single();

      if (!invitationDetails) {
        throw new Error('Failed to retrieve invitation details');
      }

      // Get inviter's profile information
      const { data: inviterProfile } = await supabase
        .from('user_profiles')
        .select('display_name, full_name')
        .eq('id', user.id)
        .single();

      const inviterName = inviterProfile?.display_name || inviterProfile?.full_name || 'A family member';

      // Create invitation URL
      const invitationUrl = `${process.env.EXPO_PUBLIC_APP_URL || 'https://your-app-url.com'}/invite?token=${invitationToken}`;

      // Send invitation email
      try {
        await EmailService.sendFamilyInvitation({
          to: email,
          familyName: familyAccount.name,
          inviterName: inviterName,
          invitationUrl: invitationUrl,
          expiresAt: invitationDetails.expires_at as string
        });

        console.log('Invitation email sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't throw here - the invitation was created successfully
        // Just log the error for debugging
      }

      // Refresh invitations
      await fetchInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  };

  // Accept invitation
  const acceptInvitation = async (token: string) => {
    try {
      const { error } = await supabase.rpc('accept_family_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      // Refresh family account data
      await fetchFamilyAccount();
      await fetchFamilyMembers();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  };

  // Decline invitation
  const declineInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      // Refresh invitations
      await fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  };

  // Remove member
  const removeMember = async (userId: string) => {
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_account_id', familyAccount.id)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      await fetchFamilyMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  };

  // Update member role
  const updateMemberRole = async (userId: string, role: 'admin' | 'member') => {
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role })
        .eq('family_account_id', familyAccount.id)
        .eq('user_id', userId);

      if (error) throw error;

      // Refresh members
      await fetchFamilyMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  };

  // Refresh operations
  const refreshFamilyAccount = useCallback(async () => {
    await fetchFamilyAccount();
  }, [fetchFamilyAccount]);

  const refreshMembers = useCallback(async () => {
    await fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const refreshInvitations = useCallback(async () => {
    await fetchInvitations();
  }, [fetchInvitations]);

  // Initial data fetch
  useEffect(() => {
    fetchFamilyAccount();
  }, [fetchFamilyAccount]);

  // Fetch members when family account changes
  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  // Fetch invitations when family account changes
  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const value = {
    familyAccount,
    userRole,
    familyMembers,
    invitations,
    loading,
    loadingMembers,
    loadingInvitations,
    createFamilyAccount,
    updateFamilyAccount,
    inviteMember,
    acceptInvitation,
    declineInvitation,
    removeMember,
    updateMemberRole,
    refreshFamilyAccount,
    refreshMembers,
    refreshInvitations,
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}; 