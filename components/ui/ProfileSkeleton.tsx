import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const SkeletonBox: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style 
}) => {
  const { colors } = useTheme();
  
  return (
    <View 
      style={[
        styles.skeleton, 
        { 
          width, 
          height, 
          borderRadius, 
          backgroundColor: colors.border 
        }, 
        style
      ]} 
    />
  );
};

export const ProfileSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <SkeletonBox width={24} height={24} borderRadius={12} />
        <SkeletonBox width={100} height={24} />
        <SkeletonBox width={60} height={32} borderRadius={8} />
      </View>

      <View style={styles.content}>
        {/* Profile Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.profileHeader}>
            <SkeletonBox width={80} height={80} borderRadius={40} />
            <View style={styles.profileInfo}>
              <SkeletonBox width={150} height={24} style={{ marginBottom: 8 }} />
              <SkeletonBox width={200} height={16} style={{ marginBottom: 4 }} />
              <SkeletonBox width={120} height={14} />
            </View>
          </View>
        </View>

        {/* Personal Info Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SkeletonBox width={150} height={18} style={{ marginBottom: 16 }} />
          
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.infoItem}>
              <SkeletonBox width={20} height={20} borderRadius={10} />
              <View style={styles.infoContent}>
                <SkeletonBox width={80} height={14} style={{ marginBottom: 4 }} />
                <SkeletonBox width={120} height={16} />
              </View>
            </View>
          ))}
        </View>

        {/* Account Details Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SkeletonBox width={120} height={18} style={{ marginBottom: 16 }} />
          
          {[1, 2, 3].map((item) => (
            <View key={item} style={styles.infoItem}>
              <SkeletonBox width={20} height={20} borderRadius={10} />
              <View style={styles.infoContent}>
                <SkeletonBox width={100} height={14} style={{ marginBottom: 4 }} />
                <SkeletonBox width={80} height={16} />
              </View>
            </View>
          ))}
          
          <SkeletonBox width="100%" height={44} borderRadius={8} style={{ marginTop: 16, marginBottom: 8 }} />
          
          <View style={styles.infoItem}>
            <SkeletonBox width={20} height={20} borderRadius={10} />
            <View style={styles.infoContent}>
              <SkeletonBox width={120} height={14} style={{ marginBottom: 4 }} />
              <SkeletonBox width={60} height={16} />
            </View>
            <SkeletonBox width={20} height={20} />
          </View>
        </View>

        {/* Actions Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <View style={styles.infoItem}>
            <SkeletonBox width={40} height={40} borderRadius={20} />
            <SkeletonBox width={80} height={16} style={{ marginLeft: 12, flex: 1 }} />
            <SkeletonBox width={20} height={20} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const EditProfileSkeleton = () => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <SkeletonBox width={24} height={24} borderRadius={12} />
        <SkeletonBox width={120} height={24} />
        <SkeletonBox width={60} height={32} borderRadius={8} />
      </View>

      <View style={styles.content}>
        {/* Profile Photo Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SkeletonBox width={120} height={18} style={{ marginBottom: 16 }} />
          
          <View style={styles.photoSection}>
            <SkeletonBox width={100} height={100} borderRadius={50} style={{ marginBottom: 12 }} />
            <SkeletonBox width={180} height={14} />
          </View>
        </View>

        {/* Personal Information Section Skeleton */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <SkeletonBox width={150} height={18} style={{ marginBottom: 16 }} />
          
          {[1, 2, 3, 4].map((item) => (
            <View key={item} style={styles.inputGroup}>
              <SkeletonBox width={80} height={14} style={{ marginBottom: 8 }} />
              <SkeletonBox width="100%" height={44} borderRadius={8} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  photoSection: {
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  skeleton: {
    opacity: 0.6,
  },
});
