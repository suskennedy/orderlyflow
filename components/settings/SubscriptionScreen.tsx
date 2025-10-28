import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/contexts/ThemeContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  color: string;
  icon: string;
}

export default function SubscriptionScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: [
        'Up to 3 homes',
        'Basic task management',
        'Community support',
        'Limited storage (1GB)',
        'Basic reports'
      ],
      color: '#6B7280',
      icon: 'home-outline'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$9.99',
      period: 'month',
      features: [
        'Unlimited homes',
        'Advanced task management',
        'Priority support',
        '10GB storage',
        'Advanced reports & analytics',
        'Calendar integration',
        'Team collaboration'
      ],
      isPopular: true,
      isCurrent: true,
      color: '#3B82F6',
      icon: 'star-outline'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$19.99',
      period: 'month',
      features: [
        'Everything in Premium',
        'Unlimited storage',
        'Custom integrations',
        'Advanced automation',
        'White-label options',
        'API access',
        'Dedicated support',
        'Custom branding'
      ],
      color: '#8B5CF6',
      icon: 'diamond-outline'
    }
  ];

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.isCurrent) {
      // Show current plan details or cancellation options
      return;
    }
    
    // Handle plan selection logic here
    console.log('Selected plan:', plan.name);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: colors.text }]}>Subscription Plans</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderPlanCard = (plan: SubscriptionPlan) => (
    <View key={plan.id} style={[styles.planCard, { backgroundColor: colors.surface }]}>
      {plan.isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      )}
      
      {plan.isCurrent && (
        <View style={[styles.currentBadge, { backgroundColor: colors.success }]}>
          <Text style={styles.currentText}>Current Plan</Text>
        </View>
      )}

      <View style={styles.planHeader}>
        <View style={[styles.iconContainer, { backgroundColor: plan.color + '15' }]}>
          <Ionicons name={plan.icon as any} size={32} color={plan.color} />
        </View>
        <View style={styles.planInfo}>
          <Text style={[styles.planName, { color: colors.text }]}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={[styles.price, { color: plan.color }]}>{plan.price}</Text>
            <Text style={[styles.period, { color: colors.textSecondary }]}>/{plan.period}</Text>
          </View>
        </View>
      </View>

      <View style={styles.featuresContainer}>
        {plan.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: plan.isCurrent ? colors.border : plan.color,
            borderColor: plan.color,
          }
        ]}
        onPress={() => handleSelectPlan(plan)}
        disabled={plan.isCurrent}
      >
        <Text style={[
          styles.selectButtonText,
          {
            color: plan.isCurrent ? colors.textSecondary : 'white'
          }
        ]}>
          {plan.isCurrent ? 'Current Plan' : `Choose ${plan.name}`}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCurrentPlanInfo = () => (
    <View style={[styles.currentPlanCard, { backgroundColor: colors.surface }]}>
      <View style={styles.currentPlanHeader}>
        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
        <Text style={[styles.currentPlanTitle, { color: colors.text }]}>Current Subscription</Text>
      </View>
      
      <View style={styles.currentPlanDetails}>
        <Text style={[styles.currentPlanName, { color: colors.text }]}>Premium Plan</Text>
        <Text style={[styles.currentPlanPrice, { color: colors.textSecondary }]}>$9.99/month</Text>
        <Text style={[styles.currentPlanExpiry, { color: colors.textSecondary }]}>
          Next billing: January 15, 2024
        </Text>
      </View>

      <View style={styles.currentPlanActions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]}>
          <Ionicons name="card-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Update Payment</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.error }]}>
          <Ionicons name="close-circle-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Cancel Subscription</Text>
        </TouchableOpacity>
      </View>
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
          {renderCurrentPlanInfo()}
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Plans</Text>
          
          {subscriptionPlans.map(renderPlanCard)}
          
          <View style={[styles.footerCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="shield-checkmark-outline" size={32} color={colors.success} />
            <Text style={[styles.footerTitle, { color: colors.text }]}>Secure & Reliable</Text>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Your subscription is protected with industry-standard security. 
              Cancel anytime with no hidden fees.
            </Text>
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },
  currentPlanCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  currentPlanDetails: {
    marginBottom: 20,
  },
  currentPlanName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 16,
    marginBottom: 4,
  },
  currentPlanExpiry: {
    fontSize: 14,
  },
  currentPlanActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  planCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  currentBadge: {
    position: 'absolute',
    top: -8,
    left: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  currentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  period: {
    fontSize: 16,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footerCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 10,
  },
  footerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
