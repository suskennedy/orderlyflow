import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../lib/contexts/ThemeContext';
import DatePicker from './DatePicker';

interface TaskCompletionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (completionData: any) => void;
  vendors: any[];
}

export default function TaskCompletionModal({
  visible,
  onClose,
  onComplete,
  vendors
}: TaskCompletionModalProps) {
  const { colors } = useTheme();
  
  // Completion modal state
  const [completionType, setCompletionType] = useState<'vendor' | 'external'>('vendor');
  const [completedByVendorId, setCompletedByVendorId] = useState<string | null>(null);
  const [completedByExternalName, setCompletedByExternalName] = useState<string>('');
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);

  const handleCompleteTask = () => {
    // Validate based on completion type
    if (completionType === 'vendor' && !completedByVendorId) {
      alert('Please select a vendor');
      return;
    }
    
    if (completionType === 'external' && !completedByExternalName.trim()) {
      alert('Please enter the external person name');
      return;
    }

    const completionData = {
      status: 'completed',
      completed_by_type: completionType,
      completed_by_vendor_id: completionType === 'vendor' ? completedByVendorId : null,
      completed_by_external_name: completionType === 'external' ? completedByExternalName.trim() : null,
      completed_at: completionDate,
      completion_verification_status: completionType === 'vendor' ? 'verified' : 'pending',
      completion_notes: `Completed by ${completionType === 'vendor' ? 
        (vendors.find(v => v.id === completedByVendorId)?.name || 'Vendor') : 
        completedByExternalName.trim()}`
    };

    onComplete(completionData);
    
    // Reset form
    setCompletionType('vendor');
    setCompletedByVendorId(null);
    setCompletedByExternalName('');
    setCompletionDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Task</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Completion Type</Text>
              <View style={styles.completionTypeSelection}>
                <TouchableOpacity
                  style={[
                    styles.completionTypeButton,
                    completionType === 'vendor' && styles.selectedCompletionTypeButton,
                    { backgroundColor: completionType === 'vendor' ? colors.primaryLight : colors.background }
                  ]}
                  onPress={() => setCompletionType('vendor')}
                >
                  <Ionicons name="person-circle" size={20} color={completionType === 'vendor' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.completionTypeText, { color: completionType === 'vendor' ? colors.primary : colors.text }]}>
                    Vendor
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.completionTypeButton,
                    completionType === 'external' && styles.selectedCompletionTypeButton,
                    { backgroundColor: completionType === 'external' ? colors.primaryLight : colors.background }
                  ]}
                  onPress={() => setCompletionType('external')}
                >
                  <Ionicons name="link" size={20} color={completionType === 'external' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.completionTypeText, { color: completionType === 'external' ? colors.primary : colors.text }]}>
                    External
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {completionType === 'vendor' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Select Vendor</Text>
                <View style={[styles.vendorSelectionContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {vendors.length > 0 ? (
                    vendors.map((vendor) => (
                      <TouchableOpacity
                        key={vendor.id}
                        style={[
                          styles.vendorOption,
                          completedByVendorId === vendor.id && { backgroundColor: colors.primaryLight, borderColor: colors.primary }
                        ]}
                        onPress={() => setCompletedByVendorId(vendor.id)}
                      >
                        <View style={styles.vendorOptionContent}>
                          <Ionicons 
                            name="person-circle" 
                            size={24} 
                            color={completedByVendorId === vendor.id ? colors.primary : colors.textSecondary} 
                          />
                          <View style={styles.vendorOptionInfo}>
                            <Text style={[
                              styles.vendorOptionName, 
                              { color: completedByVendorId === vendor.id ? colors.primary : colors.text }
                            ]}>
                              {vendor.name}
                            </Text>
                            {vendor.category && (
                              <Text style={[
                                styles.vendorOptionCategory, 
                                { color: completedByVendorId === vendor.id ? colors.primary : colors.textSecondary }
                              ]}>
                                {vendor.category}
                              </Text>
                            )}
                          </View>
                        </View>
                        {completedByVendorId === vendor.id && (
                          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.noVendorsContainer}>
                      <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
                      <Text style={[styles.noVendorsTitle, { color: colors.text }]}>No Vendors Available</Text>
                      <Text style={[styles.noVendorsText, { color: colors.textSecondary }]}>
                        Add vendors in the Vendors section to assign tasks
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {completionType === 'external' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>External Person Name</Text>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border 
                  }]}
                  placeholder="Enter name of external person"
                  placeholderTextColor={colors.textSecondary}
                  value={completedByExternalName}
                  onChangeText={setCompletedByExternalName}
                  maxLength={255}
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Completion Date</Text>
              <DatePicker
                label=""
                value={completionDate}
                placeholder="Select completion date"
                onChange={(dateString) => {
                  if (dateString) {
                    setCompletionDate(dateString);
                  }
                }}
                isOptional={true}
              />
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.textSecondary }]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, { color: colors.background }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleCompleteTask}
            >
              <Text style={[styles.modalButtonText, { color: colors.background }]}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completionTypeSelection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 15,
  },
  completionTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    marginHorizontal: 2,
  },
  selectedCompletionTypeButton: {
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  completionTypeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  vendorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 4,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  vendorSelectionContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    maxHeight: 200,
  },
  vendorOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  vendorOptionInfo: {
    marginLeft: 12,
  },
  vendorOptionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  vendorOptionCategory: {
    fontSize: 12,
  },
  noVendorsContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noVendorsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  noVendorsText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 