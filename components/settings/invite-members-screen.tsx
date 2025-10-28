import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

export default function InviteMembersScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const handleInvite = () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    Alert.alert(
      'Send Invitation',
      `Send invitation to ${email} as ${role}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            // Handle invitation logic here
            Alert.alert('Success', `Invitation sent to ${email}`);
            setEmail('');
          }
        }
      ]
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Invite Members</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderRoleSelector = () => (
    <View style={[styles.section, { backgroundColor: colors.surface }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Role</Text>
      
      <TouchableOpacity 
        style={[
          styles.roleOption,
          { 
            backgroundColor: role === 'member' ? colors.primary + '15' : colors.background,
            borderColor: role === 'member' ? colors.primary : colors.border
          }
        ]}
        onPress={() => setRole('member')}
      >
        <View style={styles.roleContent}>
          <Ionicons name="person-outline" size={24} color={colors.primary} />
          <View style={styles.roleInfo}>
            <Text style={[styles.roleName, { color: colors.text }]}>Family Member</Text>
            <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
              Can view and manage tasks, but cannot invite others
            </Text>
          </View>
        </View>
        {role === 'member' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.roleOption,
          { 
            backgroundColor: role === 'admin' ? colors.primary + '15' : colors.background,
            borderColor: role === 'admin' ? colors.primary : colors.border
          }
        ]}
        onPress={() => setRole('admin')}
      >
        <View style={styles.roleContent}>
          <Ionicons name="shield-outline" size={24} color={colors.primary} />
          <View style={styles.roleInfo}>
            <Text style={[styles.roleName, { color: colors.text }]}>Home Manager</Text>
            <Text style={[styles.roleDescription, { color: colors.textSecondary }]}>
              Full access including inviting others and managing permissions
            </Text>
          </View>
        </View>
        {role === 'admin' && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite New Member</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              Send an invitation to join your household. They&apos;ll receive an email with instructions to get started.
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.border 
                }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.inviteButton, { backgroundColor: colors.primary }]}
              onPress={handleInvite}
            >
              <Ionicons name="send-outline" size={20} color="white" />
              <Text style={styles.inviteButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>

          {renderRoleSelector()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  roleOption: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});
