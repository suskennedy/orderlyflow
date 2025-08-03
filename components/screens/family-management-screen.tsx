import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFamily } from '../../lib/contexts/FamilyContext';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function FamilyManagementScreen() {
  const { colors } = useTheme();
  const { 
    familyAccount, 
    userRole, 
    familyMembers, 
    invitations, 
    loading,
    inviteMember, 
    removeMember, 
    updateMemberRole,
    declineInvitation 
  } = useFamily();
  const insets = useSafeAreaInsets();
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const canManageFamily = userRole?.role === 'owner' || userRole?.role === 'admin';

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      setIsInviting(true);
      await inviteMember(inviteEmail.trim());
      setInviteEmail('');
      Alert.alert('Success', 'Invitation sent successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from the family account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(memberId);
              Alert.alert('Success', 'Member removed successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove member');
            }
          }
        }
      ]
    );
  };

  const handleUpdateRole = (memberId: string, currentRole: string, memberName: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    const roleText = newRole === 'admin' ? 'Administrator' : 'Member';
    
    Alert.alert(
      'Update Role',
      `Change ${memberName}'s role to ${roleText}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            try {
              await updateMemberRole(memberId, newRole as 'admin' | 'member');
              Alert.alert('Success', 'Role updated successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update role');
            }
          }
        }
      ]
    );
  };

  const handleDeclineInvitation = (invitationId: string, email: string) => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline the invitation for ${email}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              await declineInvitation(invitationId);
              Alert.alert('Success', 'Invitation declined');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to decline invitation');
            }
          }
        }
      ]
    );
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'admin': return 'Administrator';
      case 'member': return 'Member';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return colors.primary;
      case 'admin': return colors.secondary;
      case 'member': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading family account...</Text>
        </View>
      </View>
    );
  }

  if (!familyAccount) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Family Management</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Family Account</Text>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            You haven't created or joined a family account yet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colors.background,
        paddingTop: insets.top + 20 
      }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Family Management</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Family Account Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Account</Text>
          
          <View style={[styles.accountCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.accountName, { color: colors.text }]}>{familyAccount.name}</Text>
            <Text style={[styles.accountInfo, { color: colors.textSecondary }]}>
              {familyMembers.length} of {familyAccount.max_members} members
            </Text>
            <Text style={[styles.userRole, { color: getRoleColor(userRole?.role || 'member') }]}>
              Your role: {getRoleDisplayName(userRole?.role || 'member')}
            </Text>
          </View>
        </View>

        {/* Invite New Member */}
        {canManageFamily && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite New Member</Text>
            
            <View style={[styles.inviteCard, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.emailInput, { 
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={inviteEmail}
                onChangeText={setInviteEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.inviteButton, 
                  { 
                    backgroundColor: isInviting ? colors.textSecondary : colors.primary,
                    opacity: isInviting ? 0.6 : 1
                  }
                ]}
                onPress={handleInviteMember}
                disabled={isInviting}
              >
                <Text style={[styles.inviteButtonText, { color: colors.background }]}>
                  {isInviting ? 'Sending...' : 'Send Invitation'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Pending Invitations */}
        {invitations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Invitations</Text>
            
            <View style={[styles.invitationsCard, { backgroundColor: colors.surface }]}>
              {invitations.map((invitation) => (
                <View key={invitation.id} style={styles.invitationItem}>
                  <View style={styles.invitationInfo}>
                    <Text style={[styles.invitationEmail, { color: colors.text }]}>
                      {invitation.email}
                    </Text>
                    <Text style={[styles.invitationDate, { color: colors.textSecondary }]}>
                      Invited {new Date(invitation.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {canManageFamily && (
                    <TouchableOpacity
                      style={[styles.declineButton, { backgroundColor: colors.errorLight }]}
                      onPress={() => handleDeclineInvitation(invitation.id, invitation.email)}
                    >
                      <Ionicons name="close" size={16} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Family Members */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Family Members</Text>
          
          <View style={[styles.membersCard, { backgroundColor: colors.surface }]}>
            {familyMembers.map((member) => (
              <View key={member.id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.memberDetails}>
                    <Text style={[styles.memberName, { color: colors.text }]}>
                      {member.user?.display_name || member.user?.email || 'Unknown User'}
                    </Text>
                    <Text style={[styles.memberEmail, { color: colors.textSecondary }]}>
                      {member.user?.email}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.memberActions}>
                  <View style={[
                    styles.roleBadge, 
                    { backgroundColor: getRoleColor(member.role) + '20' }
                  ]}>
                    <Text style={[styles.roleText, { color: getRoleColor(member.role) }]}>
                      {getRoleDisplayName(member.role)}
                    </Text>
                  </View>
                  
                  {canManageFamily && member.role !== 'owner' && (
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.secondaryLight }]}
                        onPress={() => handleUpdateRole(member.user_id, member.role, member.user?.display_name || 'this member')}
                      >
                        <Ionicons name="swap-horizontal" size={16} color={colors.secondary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.errorLight }]}
                        onPress={() => handleRemoveMember(member.user_id, member.user?.display_name || 'this member')}
                      >
                        <Ionicons name="trash" size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  accountCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accountName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  accountInfo: {
    fontSize: 16,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
  },
  inviteCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emailInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  inviteButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  invitationsCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  invitationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  invitationInfo: {
    flex: 1,
  },
  invitationEmail: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  invitationDate: {
    fontSize: 14,
  },
  declineButton: {
    padding: 8,
    borderRadius: 6,
  },
  membersCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
}); 