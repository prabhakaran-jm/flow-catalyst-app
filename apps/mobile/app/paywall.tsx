import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { theme } from '@/theme';
import { useRevenueCat } from '@/src/providers/RevenueCatProvider';

const TERMS_URL = 'https://github.com/prabhakaran-jm/flow-catalyst-app/blob/master/docs/legal/TERMS_OF_SERVICE.md';
const PRIVACY_URL = 'https://github.com/prabhakaran-jm/flow-catalyst-app/blob/master/docs/legal/PRIVACY_POLICY.md';

const FEATURES = [
  'All 5 coaches',
  'Create Coach',
  'Unlimited runs',
  'AI Magic Wand refinement',
  'Save to library',
];

type PackageOption = { pkg: import('react-native-purchases').PurchasesPackage; title: string; period: string };

function getPackageOptions(packages: import('react-native-purchases').PurchasesPackage[]): PackageOption[] {
  const options: PackageOption[] = [];
  const annual = packages.find(p => p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('yearly'));
  const monthly = packages.find(p => p.identifier.toLowerCase().includes('monthly'));
  if (annual) options.push({ pkg: annual, title: 'Yearly', period: '/year' });
  if (monthly) options.push({ pkg: monthly, title: 'Monthly', period: '/month' });
  return options;
}

const DEMO_OPTIONS = [
  { id: 'monthly', title: 'Monthly', period: '/month', price: 'Free for demo' },
  { id: 'annual', title: 'Annual', period: '/year', price: 'Free for demo' },
];

const OFFERINGS_LOAD_TIMEOUT_MS = 10000;

export default function Paywall() {
  const router = useRouter();
  const { offerings, loadingOfferings, fetchOfferings, purchasePackage, restorePurchases, plan, refreshEntitlements, setPlanForTesting } = useRevenueCat();
  const [loadingStart, setLoadingStart] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [offeringsTimedOut, setOfferingsTimedOut] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const celebrationScale = useRef(new Animated.Value(0)).current;

  const skipRevenueCat = Constants.expoConfig?.extra?.skipRevenueCat === true;
  const isDemoMode = skipRevenueCat && typeof setPlanForTesting === 'function';

  // Client-side timeout so we never spin forever if RevenueCat hangs
  useEffect(() => {
    if (!loadingOfferings) {
      setOfferingsTimedOut(false);
      return;
    }
    const t = setTimeout(() => setOfferingsTimedOut(true), OFFERINGS_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [loadingOfferings]);

  const packageOptions = useMemo(() => {
    const current = offerings?.current;
    if (!current?.availablePackages?.length) return [];
    return getPackageOptions(current.availablePackages);
  }, [offerings]);

  // Fetch offerings only when we don't already have packages (avoids flicker and repeated loading).
  // refreshEntitlements is safe to call on mount for up-to-date plan.
  useEffect(() => {
    refreshEntitlements();
    if (packageOptions.length > 0) return; // Already have pricing; don't re-fetch and re-enter loading
    fetchOfferings();
  }, [refreshEntitlements, fetchOfferings, packageOptions.length]);

  useEffect(() => {
    if (packageOptions.length > 0) {
      const yearlyIdx = packageOptions.findIndex(o => o.period === '/year');
      setSelectedIndex(yearlyIdx >= 0 ? yearlyIdx : 0);
    }
  }, [packageOptions.length]);

  const selectedPackage = packageOptions[selectedIndex]?.pkg;

  const handleStartPro = async () => {
    try {
      setLoadingStart(true);
      if (selectedPackage) {
        await purchasePackage(selectedPackage);
      } else {
        throw new Error('No package selected');
      }
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }
      celebrationScale.setValue(0);
      setShowSuccessCelebration(true);
      Animated.sequence([
        Animated.spring(celebrationScale, {
          toValue: 1.2,
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
          tension: 100,
        }),
      ]).start();
      setTimeout(() => {
        setShowSuccessCelebration(false);
        Alert.alert('Success', 'Subscription activated!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 1200);
    } catch (error) {
      console.error('Purchase error:', error);
      const msg = error instanceof Error ? error.message : 'Failed to complete purchase.';
      const isConfigError = msg.toLowerCase().includes('configuration') || msg.toLowerCase().includes('config');
      Alert.alert(
        'Purchase Failed',
        isConfigError
          ? `In-app purchases require proper setup: ensure products are created in ${Platform.OS === 'ios' ? 'App Store Connect' : 'Google Play Console'} and linked in RevenueCat Dashboard.`
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
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }
      Alert.alert('Success', 'Purchase restored!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('Restore Failed', 'No active subscription found.');
    } finally {
      setLoadingRestore(false);
    }
  };

  const hasOfferings = packageOptions.length > 0;
  const showLoadingSpinner = loadingOfferings && !offeringsTimedOut;
  const showDemoPricing = isDemoMode && !hasOfferings && !loadingOfferings;
  const showPricingUnavailable = !hasOfferings && (offeringsTimedOut || (!loadingOfferings && !showDemoPricing));

  const handleUnlockPro = async () => {
    if (showDemoPricing && setPlanForTesting) {
      setLoadingStart(true);
      setPlanForTesting('pro');
      setLoadingStart(false);
      Alert.alert('Demo', 'Pro unlocked for this session. No payment.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }
    await handleStartPro();
  };

  const handleRestoreOrDemo = async () => {
    if (showDemoPricing && setPlanForTesting) {
      setPlanForTesting('pro');
      if (Platform.OS !== 'web') {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (_) {}
      }
      Alert.alert('Demo', 'Pro unlocked for this session.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
      return;
    }
    await handleRestore();
  };

  return (
    <>
    {showSuccessCelebration && (
      <View style={styles.celebrationOverlay} pointerEvents="none">
        <Animated.View style={[styles.celebrationIconWrap, { transform: [{ scale: celebrationScale }] }]}>
          <Ionicons name="checkmark-circle" size={80} color={theme.colors.accent} />
          <Text style={styles.celebrationText}>You're Pro!</Text>
        </Animated.View>
      </View>
    )}
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Go Pro</Text>
        <Text style={styles.subtitle}>All 5 coaches. Unlimited runs. Zero friction.</Text>
      </View>

      <View style={styles.features}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureCard}>
            <Text style={styles.featureText}>✓ {feature}</Text>
          </View>
        ))}
      </View>

      {showLoadingSpinner ? (
        <View style={styles.pricingLoading}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={styles.pricingLoadingText}>Loading pricing…</Text>
        </View>
      ) : showDemoPricing ? (
        <View style={styles.packageOptions}>
          {DEMO_OPTIONS.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.packageOption, isSelected && styles.packageOptionSelected]}
                onPress={() => setSelectedIndex(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.packageOptionContent}>
                  <Text style={styles.packageTitle}>{opt.title}</Text>
                  <Text style={styles.packagePrice}>
                    {opt.price}
                    <Text style={styles.packagePeriod}>{opt.period}</Text>
                  </Text>
                </View>
                {isSelected && <View style={styles.packageCheck} />}
              </TouchableOpacity>
            );
          })}
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textSecondary, textAlign: 'center' as const, marginTop: theme.spacing.sm }]}>
            Sandbox / demo — no real charge
          </Text>
        </View>
      ) : showPricingUnavailable ? (
        <View style={styles.pricingFallbackWrap}>
          <Text style={styles.pricingFallback}>Pricing not available yet.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setOfferingsTimedOut(false); fetchOfferings(); }} disabled={loadingOfferings}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.packageOptions}>
          {packageOptions.map((opt, idx) => {
            const product = opt.pkg.product;
            const priceString = product?.priceString ?? '';
            const pricePerMonth = opt.period === '/year' ? product?.pricePerMonthString : null;
            const isSelected = selectedIndex === idx;
            return (
              <TouchableOpacity
                key={opt.pkg.identifier}
                style={[styles.packageOption, isSelected && styles.packageOptionSelected]}
                onPress={() => setSelectedIndex(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.packageOptionContent}>
                  <Text style={styles.packageTitle}>{opt.title}</Text>
                  <Text style={styles.packagePrice}>
                    {priceString}
                    <Text style={styles.packagePeriod}>{opt.period}</Text>
                  </Text>
                  {pricePerMonth && (
                    <Text style={styles.packagePerMonth}>{pricePerMonth} / month</Text>
                  )}
                </View>
                {isSelected && <View style={styles.packageCheck} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, (loadingStart || (!hasOfferings && !showDemoPricing) || plan === 'pro') && styles.buttonDisabled]}
        onPress={handleUnlockPro}
        disabled={loadingStart || (!hasOfferings && !showDemoPricing) || plan === 'pro'}
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
        onPress={handleRestoreOrDemo}
        disabled={loadingRestore || plan === 'pro'}
      >
        {loadingRestore ? (
          <ActivityIndicator color={theme.colors.accent} size="small" />
        ) : (
          <Text style={styles.secondaryButtonText}>Restore purchase</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.footer}>Cancel anytime.</Text>

      <View style={styles.legalLinks}>
        <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={styles.legalLinkText}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.legalSeparator}>|</Text>
        <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
          <Text style={styles.legalLinkText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rcStatus}>
        <Ionicons name="shield-checkmark-outline" size={12} color={theme.colors.textSecondary} />
        <Text style={styles.rcStatusText}>
          Secured by RevenueCat {isDemoMode ? '(Demo Mode)' : ''}
        </Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Maybe Later</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
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
  pricingLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  pricingLoadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  pricingFallbackWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  pricingFallback: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  retryButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xs,
  },
  retryButtonText: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  packageOptions: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  packageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background,
  },
  packageOptionSelected: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
    backgroundColor: theme.colors.accentLightBackground,
  },
  packageOptionContent: {
    flex: 1,
  },
  packageTitle: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.text,
  },
  packagePrice: {
    ...theme.typography.body,
    color: theme.colors.text,
    marginTop: 2,
  },
  packagePeriod: {
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  packagePerMonth: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  packageCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    marginLeft: theme.spacing.sm,
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
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  legalLinkText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  rcStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: theme.spacing.lg,
    opacity: 0.6,
  },
  rcStatusText: {
    ...theme.typography.bodySmall,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  celebrationIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    ...theme.typography.h2,
    color: theme.colors.accent,
    marginTop: theme.spacing.sm,
    fontWeight: '700',
  },
});
