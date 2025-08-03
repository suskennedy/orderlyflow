import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { FamilyAccount, FamilyInvitation, FamilyMember } from '../../types/family';
import { useAuth } from '../hooks/useAuth';
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
      setFamilyAccount(null);
      setUserRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user's role and family account
      const { data: userRoleData, error: roleError } = await supabase
        .from('family_members')
        .select(`
          *,
          family_accounts (*)
        `)
        .eq('user_id', user.id)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }

      if (userRoleData) {
        setUserRole(userRoleData);
        setFamilyAccount(userRoleData.family_accounts);
      } else {
        setUserRole(null);
        setFamilyAccount(null);
      }
    } catch (error) {
      console.error('Error fetching family account:', error);
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
      
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          user_profiles (
            display_name,
            email,
            avatar_url
          )
        `)
        .eq('family_account_id', familyAccount.id)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching family members:', error);
      } else {
        setFamilyMembers(data || []);
      }
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
      
      const { data, error } = await supabase
        .from('family_invitations')
        .select(`
          *,
          user_profiles!invited_by (
            display_name,
            email
          ),
          family_accounts (
            name
          )
        `)
        .eq('family_account_id', familyAccount.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
      } else {
        setInvitations(data || []);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoadingInvitations(false);
    }
  }, [familyAccount?.id]);

  // Create family account
  const createFamilyAccount = async (name: string) => {
    try {
      const { data, error } = await supabase.rpc('create_family_account', {
        account_name: name
      });

      if (error) throw error;

      // Refresh family account data
      await fetchFamilyAccount();
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
    try {
      const { data, error } = await supabase.rpc('invite_family_member', {
        invitee_email: email
      });

      if (error) throw error;

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