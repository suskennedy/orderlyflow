import { useEffect } from 'react';
import { useFamilyStore } from '../stores/familyStore';
import { useAuth } from './useAuth';

export function useFamily() {
  const { user } = useAuth();
  const {
    familyAccount,
    userRole,
    familyMembers,
    invitations,
    loading,
    loadingMembers,
    loadingInvitations,
    fetchFamilyAccount,
    fetchFamilyMembers,
    fetchInvitations,
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
  } = useFamilyStore();

  // Initial data fetch
  useEffect(() => {
    if (user?.id) {
      fetchFamilyAccount(user.id);
    } else {
      useFamilyStore.setState({ 
        familyAccount: null, 
        userRole: null, 
        familyMembers: [], 
        invitations: [],
        loading: false 
      });
    }
  }, [user?.id, fetchFamilyAccount]);

  // Fetch members when family account changes
  useEffect(() => {
    if (familyAccount?.id) {
      fetchFamilyMembers();
    }
  }, [familyAccount?.id, fetchFamilyMembers]);

  // Fetch invitations when family account changes
  useEffect(() => {
    if (familyAccount?.id) {
      fetchInvitations();
    }
  }, [familyAccount?.id, fetchInvitations]);

  return {
    familyAccount,
    userRole,
    familyMembers,
    invitations,
    loading,
    loadingMembers,
    loadingInvitations,
    createFamilyAccount: (name: string) => user?.id ? createFamilyAccount(name, user.id) : Promise.reject(new Error('User not authenticated')),
    updateFamilyAccount,
    inviteMember: (email: string) => user?.id ? inviteMember(email, user.id) : Promise.reject(new Error('User not authenticated')),
    acceptInvitation,
    declineInvitation,
    removeMember,
    updateMemberRole,
    refreshFamilyAccount: () => user?.id ? refreshFamilyAccount(user.id) : Promise.resolve(),
    refreshMembers,
    refreshInvitations,
  };
}

