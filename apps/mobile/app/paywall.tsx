import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { theme } from '@/theme';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

const FEATURES = [
  'All 5 coaches',
  'Unlimited runs',
  'AI Magic Wand refinement',
  'Save to library',
  'Create custom coaches',
];

export default function Paywall() {
  const router = useRouter();
  const { purchasePro, restorePurchases, plan } = useRevenueCat();
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);

  const handleStartPro = async () => {
    try {
      setLoadingStart(true);
      await purchasePro();
      Alert.alert('Success', 'Subscription activated!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Purchase error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to complete purchase.';
      const isConfigError = msg.toLowerCase().includes('configuration') || msg.toLowerCase().includes('config');
      Alert.alert(
        'Purchase Failed',
        isConfigError
          ? 'In-app purchases require proper setup: ensure products are created in Google Play Console and linked in RevenueCat Dashboard.'
          : msg
      );
    } finally {
      setLoadingStart(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoadingRestore(true);
      await restorePurchases();
      Alert.alert('Success', 'Purchase restored!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Restore Failed', 'No active subscription found.');
    } finally {
      setLoadingRestore(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Go Pro</Text>
        <Text style={styles.subtitle}>
          Build momentum without limits.
        </Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureText}>✓ {feature}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loadingStart && styles.buttonDisabled]}
        onPress={handleStartPro}
        disabled={loadingStart || plan === 'pro'}
      >
        {loadingStart ? (
          <ActivityIndicator color={theme.colors.background} />
        ) : (
          <Text style={styles.primaryButtonText}>
            {plan === 'pro' ? 'Current Plan' : 'Unlock Pro'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, loadingRestore && styles.buttonDisabled]}
        onPress={handleRestore}
        disabled={loadingRestore || plan === 'pro'}
      >
        {loadingRestore ? (
          <ActivityIndicator color={theme.colors.accent} size="small" />
        ) : (
          <Text style={styles.secondaryButtonText}>Restore purchase</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>Cancel anytime.</Text>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
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
    paddingBottom: theme.spacing.xxl,
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
  features: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  featureCard: {
    backgroundColor: theme.colors.accentLightBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  featureText: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  primaryButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  primaryButtonText: {
    ...theme.typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  backButton: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
});
