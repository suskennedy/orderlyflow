import { create } from 'zustand';
import { FamilyAccount, FamilyInvitation, FamilyMember } from '../../types/family';
import { EmailService } from '../services/emailService';
import { supabase } from '../supabase';

interface FamilyState {
  // Family account data
  familyAccount: FamilyAccount | null;
  userRole: FamilyMember | null;
  familyMembers: FamilyMember[];
  invitations: FamilyInvitation[];
  
  // Loading states
  loading: boolean;
  loadingMembers: boolean;
  loadingInvitations: boolean;

  // Setters
  setFamilyAccount: (account: FamilyAccount | null) => void;
  setUserRole: (role: FamilyMember | null) => void;
  setFamilyMembers: (members: FamilyMember[]) => void;
  setInvitations: (invitations: FamilyInvitation[]) => void;
  setLoading: (loading: boolean) => void;
  setLoadingMembers: (loading: boolean) => void;
  setLoadingInvitations: (loading: boolean) => void;

  // Family account operations
  fetchFamilyAccount: (userId: string) => Promise<void>;
  createFamilyAccount: (name: string, userId: string) => Promise<void>;
  updateFamilyAccount: (updates: Partial<FamilyAccount>) => Promise<void>;
  
  // Member management
  fetchFamilyMembers: () => Promise<void>;
  fetchInvitations: () => Promise<void>;
  inviteMember: (email: string, userId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMemberRole: (userId: string, role: 'admin' | 'member') => Promise<void>;
  
  // Refresh operations
  refreshFamilyAccount: (userId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  familyAccount: null,
  userRole: null,
  familyMembers: [],
  invitations: [],
  loading: true,
  loadingMembers: false,
  loadingInvitations: false,

  setFamilyAccount: (account) => set({ familyAccount: account }),
  setUserRole: (role) => set({ userRole: role }),
  setFamilyMembers: (members) => set({ familyMembers: members }),
  setInvitations: (invitations) => set({ invitations }),
  setLoading: (loading) => set({ loading }),
  setLoadingMembers: (loading) => set({ loadingMembers: loading }),
  setLoadingInvitations: (loading) => set({ loadingInvitations: loading }),

  fetchFamilyAccount: async (userId: string) => {
    if (!userId) {
      console.log('No user ID, clearing family account data');
      set({ familyAccount: null, userRole: null, loading: false });
      return;
    }

    try {
      console.log('Fetching family account for user:', userId);
      set({ loading: true });
      
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('family_account_id')
        .eq('id', userId)
        .single();

      console.log('User profile data:', userProfile);
      console.log('Profile error:', profileError);

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
      }

      if (userProfile?.family_account_id) {
        console.log('User has family account ID:', userProfile.family_account_id);
        
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
          set({ familyAccount: familyData as any });
          
          const { data: memberData, error: memberError } = await supabase
            .from('family_members')
            .select('*')
            .eq('family_account_id', userProfile.family_account_id)
            .eq('user_id', userId)
            .single();

          console.log('Member data:', memberData);
          console.log('Member error:', memberError);

          if (memberError) {
            console.error('Error fetching family member:', memberError);
          } else if (memberData) {
            console.log('Setting user role:', memberData);
            set({ userRole: memberData as any });
          }
        }
      } else {
        console.log('No family account found for user');
        set({ userRole: null, familyAccount: null });
      }
    } catch (error) {
      console.error('Error fetching family account:', error);
      set({ userRole: null, familyAccount: null });
    } finally {
      set({ loading: false });
    }
  },

  fetchFamilyMembers: async () => {
    const { familyAccount } = get();
    if (!familyAccount?.id) {
      set({ familyMembers: [] });
      return;
    }

    try {
      set({ loadingMembers: true });
      
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_account_id', familyAccount.id)
        .order('joined_at', { ascending: true });

      if (membersError) {
        console.error('Error fetching family members:', membersError);
        return;
      }

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

      set({ familyMembers: membersWithProfiles as FamilyMember[] });
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      set({ loadingMembers: false });
    }
  },

  fetchInvitations: async () => {
    const { familyAccount } = get();
    if (!familyAccount?.id) {
      set({ invitations: [] });
      return;
    }

    try {
      set({ loadingInvitations: true });
      
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

      set({ invitations: invitationsWithProfiles as FamilyInvitation[] });
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      set({ loadingInvitations: false });
    }
  },

  createFamilyAccount: async (name: string, userId: string) => {
    if (!userId) {
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

      await get().fetchFamilyAccount(userId);
      console.log('Family account data refreshed');
    } catch (error) {
      console.error('Error creating family account:', error);
      throw error;
    }
  },

  updateFamilyAccount: async (updates: Partial<FamilyAccount>) => {
    const { familyAccount } = get();
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase
        .from('family_accounts')
        .update(updates)
        .eq('id', familyAccount.id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await get().fetchFamilyAccount(user.id);
      }
    } catch (error) {
      console.error('Error updating family account:', error);
      throw error;
    }
  },

  inviteMember: async (email: string, userId: string) => {
    const { familyAccount, familyMembers, invitations } = get();
    if (!familyAccount?.id || !userId) {
      throw new Error('Family account or user not found');
    }

    try {
      const currentMembers = familyMembers.length;
      const pendingInvitations = invitations.length;
      const totalUsers = currentMembers + pendingInvitations;

      if (totalUsers >= 4) {
        throw new Error('Family account is at maximum capacity (4 users). Please remove a member before inviting someone new.');
      }

      const isAlreadyMember = familyMembers.some(member => 
        member.user?.display_name === email || member.user?.full_name === email
      );

      if (isAlreadyMember) {
        throw new Error('This user is already a member of the family account.');
      }

      const hasPendingInvitation = invitations.some(invitation => 
        invitation.email.toLowerCase() === email.toLowerCase()
      );

      if (hasPendingInvitation) {
        throw new Error('An invitation has already been sent to this email address.');
      }

      console.log('Inviting member:', email);
      
      const { data: invitationToken, error: invitationError } = await supabase.rpc('invite_family_member', {
        invitee_email: email
      });

      if (invitationError) {
        console.error('Error creating invitation:', invitationError);
        throw new Error(invitationError.message || 'Failed to create invitation');
      }

      console.log('Invitation created with token:', invitationToken);

      const { data: invitationDetails } = await supabase
        .from('family_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .single();

      if (!invitationDetails) {
        throw new Error('Failed to retrieve invitation details');
      }

      const { data: inviterProfile } = await supabase
        .from('user_profiles')
        .select('display_name, full_name')
        .eq('id', userId)
        .single();

      const inviterName = inviterProfile?.display_name || inviterProfile?.full_name || 'A family member';

      const appScheme = 'orderlyflow';
      const invitationUrl = `${appScheme}://invite?token=${invitationToken}`;
      const fallbackUrl = `https://expo.dev/accounts/orderlyflow/projects/orderlyflow/invite?token=${invitationToken}`;

      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const userExists = existingUsers.users.some(existingUser => existingUser.email === email);

      try {
        await EmailService.sendFamilyInvitation({
          to: email,
          familyName: familyAccount.name,
          inviterName: inviterName,
          invitationUrl: invitationUrl,
          fallbackUrl: fallbackUrl,
          expiresAt: invitationDetails.expires_at as string,
          userExists: userExists
        });

        console.log('Invitation email sent successfully to:', email);
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
      }

      await get().fetchInvitations();
    } catch (error) {
      console.error('Error inviting member:', error);
      throw error;
    }
  },

  acceptInvitation: async (token: string) => {
    try {
      const { error } = await supabase.rpc('accept_family_invitation', {
        invitation_token: token
      });

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await get().fetchFamilyAccount(user.id);
        await get().fetchFamilyMembers();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  },

  declineInvitation: async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('family_invitations')
        .update({ status: 'expired' })
        .eq('id', invitationId);

      if (error) throw error;

      await get().fetchInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
      throw error;
    }
  },

  removeMember: async (userId: string) => {
    const { familyAccount } = get();
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase.rpc('remove_family_member', {
        member_user_id: userId
      });

      if (error) throw error;

      await get().fetchFamilyMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  },

  updateMemberRole: async (userId: string, role: 'admin' | 'member') => {
    const { familyAccount } = get();
    if (!familyAccount?.id) throw new Error('No family account found');

    try {
      const { error } = await supabase
        .from('family_members')
        .update({ role })
        .eq('family_account_id', familyAccount.id)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchFamilyMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  },

  refreshFamilyAccount: async (userId: string) => {
    await get().fetchFamilyAccount(userId);
  },

  refreshMembers: async () => {
    await get().fetchFamilyMembers();
  },

  refreshInvitations: async () => {
    await get().fetchInvitations();
  },
}));

