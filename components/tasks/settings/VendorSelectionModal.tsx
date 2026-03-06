import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { styles } from './styles';

interface VendorSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectVendor: (vendorId: string) => void;
    vendors: any[];
    colors: any;
}

const VendorSelectionModal: React.FC<VendorSelectionModalProps> = ({
    visible,
    onClose,
    onSelectVendor,
    vendors,
    colors,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>Assign Vendor</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.vendorList}>
                        {vendors.length > 0 ? (
                            vendors.map((vendor) => (
                                <TouchableOpacity
                                    key={vendor.id}
                                    style={[styles.vendorItem, { borderBottomColor: colors.border }]}
                                    onPress={() => onSelectVendor(vendor.id)}
                                >
                                    <Text style={[styles.vendorName, { color: colors.text }]}>{vendor.name}</Text>
                                    <Text style={[styles.vendorCategory, { color: colors.textSecondary }]}>
                                        {vendor.category}
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.emptyVendors}>
                                <Text style={[styles.emptyVendorsText, { color: colors.textSecondary }]}>
                                    No vendors added yet.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default VendorSelectionModal;
