import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../lib/contexts/ThemeContext';

interface TaskDetailsDropdownProps {
  task: any;
  isExpanded: boolean;
  assignedVendor: any;
  vendors: any[];
  formatDate: (dateString: string | null | undefined) => string;
  getStatusColor: (task: any) => string;
}

export default function TaskDetailsDropdown({
  task,
  isExpanded,
  assignedVendor,
  vendors,
  formatDate,
  getStatusColor
}: TaskDetailsDropdownProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      style={[
        styles.taskDetailsContainer,
        {
          maxHeight: isExpanded ? 500 : 0,
          opacity: isExpanded ? 1 : 0,
        }
      ]}
    >
      <View style={[styles.taskDetailsContent, { backgroundColor: colors.background }]}>
        {/* Description */}
        {task.description && (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
            <Text style={[styles.detailText, { color: colors.text }]}>{task.description}</Text>
          </View>
        )}

        {/* Assigned Vendor */}
        {assignedVendor && (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Assigned Vendor</Text>
            <View style={[styles.vendorDetailCard, { backgroundColor: colors.surface }]}>
              <View style={styles.vendorDetailHeader}>
                <Ionicons name="person-circle" size={20} color={colors.primary} />
                <Text style={[styles.vendorDetailName, { color: colors.text }]}>{assignedVendor.name}</Text>
              </View>
              {assignedVendor.category && (
                <Text style={[styles.vendorDetailCategory, { color: colors.textSecondary }]}>
                  {assignedVendor.category}
                </Text>
              )}
              {assignedVendor.contact_name && (
                <Text style={[styles.vendorDetailContact, { color: colors.textSecondary }]}>
                  Contact: {assignedVendor.contact_name}
                </Text>
              )}
              {assignedVendor.phone && (
                <Text style={[styles.vendorDetailContact, { color: colors.textSecondary }]}>
                  Phone: {assignedVendor.phone}
                </Text>
              )}
              {assignedVendor.email && (
                <Text style={[styles.vendorDetailContact, { color: colors.textSecondary }]}>
                  Email: {assignedVendor.email}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Instructions */}
        {task.instructions && (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Instructions</Text>
            <Text style={[styles.detailText, { color: colors.text }]}>{task.instructions}</Text>
          </View>
        )}

        {/* Frequency */}
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Frequency</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            {task.custom_frequency || task.suggested_frequency || 'As needed'}
          </Text>
        </View>

        {/* Estimated Cost */}
        {task.estimated_cost && (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Estimated Cost</Text>
            <Text style={[styles.detailText, { color: colors.text }]}>
              ${task.estimated_cost}
            </Text>
          </View>
        )}

        {/* Task Type */}
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Task Type</Text>
          <Text style={[styles.detailText, { color: colors.text }]}>
            {task.task_type === 'custom' ? 'Custom Task' : 
             task.task_type === 'preset' ? 'Template Task' : 'Legacy Task'}
          </Text>
        </View>

        {/* Status */}
        <View style={styles.detailSection}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Status</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(task) }]} />
            <Text style={[styles.detailText, { color: colors.text }]}>
              {task.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Completion Information */}
        {task.status === 'completed' && (
          <View style={styles.detailSection}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Completion Details</Text>
            <View style={[styles.completionCard, { backgroundColor: colors.surface }]}>
              {/* New completion tracking */}
              {task.completed_by_type ? (
                <>
                  <Text style={[styles.completionText, { color: colors.text }]}>
                    Completed by: {task.completed_by_type === 'vendor' ? 
                      (vendors.find(v => v.id === task.completed_by_vendor_id)?.name || 'Unknown Vendor') : 
                      task.completed_by_type === 'external' ? 
                      (task.completed_by_external_name || 'Unknown External') : 
                      'Unknown'}
                  </Text>
                  {task.completed_at && (
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                      Completed on: {formatDate(task.completed_at)}
                    </Text>
                  )}
                  {task.completion_verification_status && (
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                      Status: {task.completion_verification_status === 'verified' ? '✅ Verified' : 
                               task.completion_verification_status === 'pending' ? '⏳ Pending Verification' : 
                               task.completion_verification_status === 'disputed' ? '❌ Disputed' : 'Unknown'}
                    </Text>
                  )}
                  {task.completion_notes && (
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                      Notes: {task.completion_notes}
                    </Text>
                  )}
                  <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                    Type: {task.completed_by_type === 'vendor' ? 'Vendor Completion' : 
                           task.completed_by_type === 'external' ? 'External Completion' : 'Unknown Type'}
                  </Text>
                </>
              ) : (
                /* Legacy completion tracking */
                <>
                  {task.completed_by && (
                    <Text style={[styles.completionText, { color: colors.text }]}>
                      Completed by: {task.completed_by}
                    </Text>
                  )}
                  {task.completed_at && (
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                      Completed on: {formatDate(task.completed_at)}
                    </Text>
                  )}
                  {task.notes && task.notes.includes('Completed by') && (
                    <Text style={[styles.completionText, { color: colors.textSecondary }]}>
                      Notes: {task.notes}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  taskDetailsContainer: {
    overflow: 'hidden',
    marginTop: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  taskDetailsContent: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
  },
  vendorDetailCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vendorDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vendorDetailName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  vendorDetailCategory: {
    fontSize: 12,
    marginBottom: 4,
  },
  vendorDetailContact: {
    fontSize: 12,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  completionCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  completionText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
}); 