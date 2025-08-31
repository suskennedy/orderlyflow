import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';
import { useVendors } from '../../lib/contexts/VendorsContext';

interface TaskCompletionModalProps {
  visible: boolean;
  task: any;
  onComplete: (completionData: {
    notes: string;
    completedBy: 'user' | 'vendor' | 'external';
    externalName?: string;
    vendorId?: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function TaskCompletionModal({
  visible,
  task,
  onComplete,
  onCancel,
  isLoading = false
}: TaskCompletionModalProps) {
  const { colors } = useTheme();
  const { vendors } = useVendors();
  
  const [completionData, setCompletionData] = useState({
    notes: '',
    completedBy: 'user' as 'user' | 'vendor' | 'external',
    externalName: '',
    vendorId: '',
  });

  // Memoized vendor options for performance
  const vendorOptions = useMemo(() => vendors || [], [vendors]);

  // Memoized completion validation
  const isValidCompletion = useMemo(() => {
    if (completionData.completedBy === 'vendor' && !completionData.vendorId) {
      return false;
    }
    if (completionData.completedBy === 'external' && !completionData.externalName.trim()) {
      return false;
    }
    return true;
  }, [completionData]);

  // Callbacks for performance optimization
  const updateCompletionField = useCallback((field: string, value: any) => {
    setCompletionData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleComplete = useCallback(async () => {
    if (!isValidCompletion) return;
    
    try {
      await onComplete(completionData);
      // Reset form on successful completion
      setCompletionData({
        notes: '',
        completedBy: 'user',
        externalName: '',
        vendorId: '',
      });
    } catch (error) {
      console.error('Error completing task:', error);
    }
  }, [onComplete, completionData, isValidCompletion]);

  const handleCancel = useCallback(() => {
    // Reset form on cancel
    setCompletionData({
      notes: '',
      completedBy: 'user',
      externalName: '',
      vendorId: '',
    });
    onCancel();
  }, [onCancel]);

  const renderCompletedByOption = useCallback((type: 'user' | 'vendor' | 'external', label: string) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.completedByOption,
        {
          backgroundColor: completionData.completedBy === type 
            ? colors.primary 
            : colors.background,
          borderColor: colors.border,
        }
      ]}
      onPress={() => updateCompletionField('completedBy', type)}
      disabled={isLoading}
    >
      <Text style={[
        styles.completedByText,
        {
          color: completionData.completedBy === type 
            ? colors.textInverse 
            : colors.text
        }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  ), [completionData.completedBy, colors, updateCompletionField, isLoading]);

  const renderVendorOption = useCallback((vendor: any) => (
    <TouchableOpacity
      key={vendor.id}
      style={[
        styles.vendorOption,
        {
          backgroundColor: completionData.vendorId === vendor.id 
            ? colors.primary 
            : colors.background,
          borderColor: colors.border,
        }
      ]}
      onPress={() => updateCompletionField('vendorId', vendor.id)}
      disabled={isLoading}
    >
      <Text style={[
        styles.vendorText,
        {
          color: completionData.vendorId === vendor.id 
            ? colors.textInverse 
            : colors.text
        }
      ]}>
        {vendor.name}
      </Text>
    </TouchableOpacity>
  ), [completionData.vendorId, colors, updateCompletionField, isLoading]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Complete Task
            </Text>
            <TouchableOpacity onPress={handleCancel} disabled={isLoading}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {task && (
            <View style={styles.taskInfo}>
              <Text style={[styles.taskTitle, { color: colors.text }]}>
                {task.title}
              </Text>
              {task.category && (
                <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>
                  {task.category}
                </Text>
              )}
            </View>
          )}

          <View style={styles.modalBody}>
            {/* Completion Notes */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Completion Notes (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Add any notes about completing this task..."
                placeholderTextColor={colors.textSecondary}
                value={completionData.notes}
                onChangeText={(text) => updateCompletionField('notes', text)}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isLoading}
              />
            </View>

            {/* Who Completed */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Completed By
              </Text>
              <View style={styles.completedByContainer}>
                {renderCompletedByOption('user', 'Me')}
                {renderCompletedByOption('vendor', 'Vendor')}
                {renderCompletedByOption('external', 'Other')}
              </View>
            </View>

            {/* Vendor Selection */}
            {completionData.completedBy === 'vendor' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Select Vendor
                </Text>
                <View style={styles.vendorContainer}>
                  {vendorOptions.length > 0 ? (
                    vendorOptions.map(renderVendorOption)
                  ) : (
                    <Text style={[styles.noVendorsText, { color: colors.textSecondary }]}>
                      No vendors available
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* External Name */}
            {completionData.completedBy === 'external' && (
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Person/Company Name
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter name..."
                  placeholderTextColor={colors.textSecondary}
                  value={completionData.externalName}
                  onChangeText={(text) => updateCompletionField('externalName', text)}
                  editable={!isLoading}
                />
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                }
              ]}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.completeButton,
                {
                  backgroundColor: isValidCompletion ? colors.success : colors.border,
                  opacity: isLoading ? 0.6 : 1,
                }
              ]}
              onPress={handleComplete}
              disabled={!isValidCompletion || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <Text style={[styles.completeButtonText, { color: colors.textInverse }]}>
                  Complete Task
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  taskInfo: {
    padding: 16,
    paddingBottom: 0,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
  },
  completedByContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  completedByOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  completedByText: {
    fontSize: 14,
    fontWeight: '600',
  },
  vendorContainer: {
    gap: 8,
  },
  vendorOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  vendorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noVendorsText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 0,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
