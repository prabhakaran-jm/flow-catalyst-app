import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { theme } from '@/theme';

export default function Paywall() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Upgrade to Premium</Text>
        <Text style={styles.subtitle}>
          Unlock unlimited catalysts and advanced features
        </Text>
      </View>

      <View style={styles.plans}>
        <View style={styles.planCard}>
          <Text style={styles.planName}>Monthly</Text>
          <Text style={styles.planPrice}>$9.99</Text>
          <Text style={styles.planPeriod}>per month</Text>
          <TouchableOpacity style={styles.planButton}>
            <Text style={styles.planButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.planCard, styles.planCardFeatured]}>
          <Text style={styles.badge}>Best Value</Text>
          <Text style={styles.planName}>Yearly</Text>
          <Text style={styles.planPrice}>$79.99</Text>
          <Text style={styles.planPeriod}>per year</Text>
          <Text style={styles.savings}>Save 33%</Text>
          <TouchableOpacity style={styles.planButtonFeatured}>
            <Text style={styles.planButtonText}>Subscribe</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>What's included:</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ Unlimited Action Catalysts</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ AI-powered suggestions</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ Advanced analytics</Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureText}>✓ Priority support</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Maybe Later</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  plans: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  planCard: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  planCardFeatured: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  badge: {
    ...theme.typography.bodySmall,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
  },
  planName: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planPrice: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  planPeriod: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  savings: {
    ...theme.typography.bodySmall,
    color: theme.colors.success,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
  },
  planButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  planButtonFeatured: {
    backgroundColor: theme.colors.accentDark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  planButtonText: {
    ...theme.typography.body,
    color: theme.colors.background,
    fontWeight: '600',
  },
  features: {
    marginBottom: theme.spacing.xl,
  },
  featuresTitle: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  featureItem: {
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  backButton: {
    backgroundColor: 'transparent',
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
