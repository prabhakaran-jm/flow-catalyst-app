import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-ignore - react-native-purchases types will be available after package installation
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSupabase } from './SupabaseProvider';
import { presentRevenueCatPaywall } from '@/src/lib/presentRevenueCatPaywall';

// Get RevenueCat API keys from env.ts (local) or Expo Constants (EAS build)
function getRevenueCatApiKey(platform: 'ios' | 'android'): string | undefined {
  try {
    // Try to import env.ts (works locally)
    const { env } = require('../env');
    return platform === 'ios' ? env.REVENUECAT_API_KEY_IOS : env.REVENUECAT_API_KEY_ANDROID;
  } catch {
    // Fallback to Expo Constants (works in EAS builds)
    const extra = Constants.expoConfig?.extra || {};
    return platform === 'ios' 
      ? extra.REVENUECAT_API_KEY_IOS 
      : extra.REVENUECAT_API_KEY_ANDROID;
  }
}

export type Plan = 'free' | 'pro';

interface RevenueCatContextType {
  plan: Plan;
  /** Current offering (packages). Null when skipped or not yet loaded. */
  offerings: { current: PurchasesOffering | null } | null;
  loadingOfferings: boolean;
  refreshEntitlements: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePro: () => Promise<void>;
  /** Purchase a specific package (used by paywall for selected option). */
  purchasePackage: (pkg: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  /** Present RevenueCat-hosted paywall (modal). Returns { unlocked, showCustomPaywall }. When showCustomPaywall is true (e.g. Error 23), show custom /paywall as fallback. */
  presentPaywall: () => Promise<{ unlocked: boolean; showCustomPaywall: boolean }>;
  setPlanForTesting?: (plan: Plan) => void; // For testing only
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

/**
 * RevenueCat Provider
 * 
 * Provides subscription plan state and purchase methods using RevenueCat SDK.
 * 
 * Setup:
 * 1. Get API keys from RevenueCat Dashboard > Project Settings > API Keys
 * 2. Add REVENUECAT_API_KEY_IOS and REVENUECAT_API_KEY_ANDROID to env.ts
 * 3. Configure entitlements in RevenueCat Dashboard (e.g., 'pro' entitlement)
 * 4. Set up products/offerings in RevenueCat Dashboard
 */
export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useSupabase();
  const [plan, setPlan] = useState<Plan>('free');
  const [testingOverride, setTestingOverride] = useState<Plan | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [offerings, setOfferings] = useState<{ current: PurchasesOffering | null } | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(false);

  // Initialize RevenueCat SDK (skip when sideloaded - preview/dev builds not from Play Store)
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        const extra = Constants.expoConfig?.extra || {};
        if (extra.skipRevenueCat) {
          console.warn('RevenueCat skipped (preview/internal build). Using free plan.');
          setIsInitialized(true);
          return;
        }

        const apiKey = Platform.select({
          ios: getRevenueCatApiKey('ios'),
          android: getRevenueCatApiKey('android'),
          default: getRevenueCatApiKey('android'), // Fallback for web
        });

        if (!apiKey || apiKey.includes('YOUR_REVENUECAT')) {
          console.warn('RevenueCat API key not configured. Using free plan.');
          setIsInitialized(true);
          return;
        }

        // Debug logging in dev to troubleshoot paywall / offerings (see REVENUECAT_SETUP.md)
        if (__DEV__ && typeof Purchases.setLogLevel === 'function') {
          try {
            await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
          } catch (_) {}
        }

        // Configure RevenueCat
        await Purchases.configure({ apiKey });

        // Set user ID if authenticated
        if (user?.id) {
          await Purchases.logIn(user.id);
        }

        // Load initial entitlements
        await refreshEntitlements();
        setIsInitialized(true);
        // Load offerings so paywall has pricing when opened (avoids infinite "Loading pricing…")
        try {
          const OFFERINGS_TIMEOUT_MS = 12000;
          const result = await Promise.race([
            Purchases.getOfferings(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Loading pricing timed out')), OFFERINGS_TIMEOUT_MS)
            ),
          ]);
          setOfferings(result);
          const hasCurrent = result?.current != null;
          const pkgCount = result?.current?.availablePackages?.length ?? 0;
          if (__DEV__) {
            console.log('[RevenueCat] Offerings at init:', hasCurrent ? `${pkgCount} package(s)` : 'no current offering');
          }
          if (!hasCurrent && __DEV__) {
            console.warn('[RevenueCat] No current offering. Check: RevenueCat Dashboard → Offerings (default) has packages; Products linked to App Store Connect / Play Console; product IDs match.');
          }
        } catch (offeringsError) {
          console.error('Failed to fetch offerings at init:', offeringsError);
          if (__DEV__) {
            console.warn('[RevenueCat] Paywall will show "Pricing not available" / Retry. Fix: RevenueCat Dashboard (products + offering), store products, and REVENUECAT_API_KEY in EAS env.');
          }
          setOfferings(null);
        }
      } catch (error) {
        console.error('Failed to initialize RevenueCat:', error);
        // Fallback to free plan on error
        setPlan('free');
        setIsInitialized(true);
      }
    };

    initializeRevenueCat();
  }, []);

  // Update user ID when auth state changes
  useEffect(() => {
    const updateUserId = async () => {
      if (!isInitialized) return;

      try {
        if (user?.id) {
          await Purchases.logIn(user.id);
          await refreshEntitlements();
        } else {
          await Purchases.logOut();
          setPlan('free');
          setTestingOverride(null);
        }
      } catch (error) {
        console.error('Failed to update RevenueCat user ID:', error);
      }
    };

    updateUserId();
  }, [user?.id, isInitialized]);

  /**
   * Refresh entitlements from RevenueCat
   */
  const refreshEntitlements = async (): Promise<void> => {
    try {
      const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
      
      // Check if user has active 'pro' entitlement
      // Adjust this based on your RevenueCat entitlement identifier
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setPlan(isPro ? 'pro' : 'free');
    } catch (error) {
      console.error('Failed to refresh entitlements:', error);
      // On error, default to free plan
      setPlan('free');
    }
  };

  /**
   * Fetch current offerings (for paywall pricing display).
   * No-ops until SDK is initialized; auto-called when init completes.
   * Uses a timeout so the paywall never spins forever.
   */
  const fetchOfferings = async (): Promise<void> => {
    const extra = Constants.expoConfig?.extra || {};
    if (extra.skipRevenueCat) {
      setOfferings(null);
      setLoadingOfferings(false);
      return;
    }
    if (!isInitialized) {
      setLoadingOfferings(false);
      return;
    }
    setLoadingOfferings(true);
    const OFFERINGS_TIMEOUT_MS = 12000;
    try {
      const result = await Promise.race([
        Purchases.getOfferings(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Loading pricing timed out')), OFFERINGS_TIMEOUT_MS)
        ),
      ]);
      setOfferings(result);
      if (__DEV__ && result?.current) {
        console.log('[RevenueCat] Offerings fetched:', result.current.availablePackages?.length ?? 0, 'packages');
      }
    } catch (error) {
      console.error('Failed to fetch offerings:', error);
      if (__DEV__) {
        console.warn('[RevenueCat] Ensure: (1) Products in RevenueCat match App Store Connect / Play Console IDs (2) Offering has packages attached (3) REVENUECAT_API_KEY_IOS/ANDROID in EAS production env');
      }
      setOfferings(null);
    } finally {
      setLoadingOfferings(false);
    }
  };

  /**
   * Purchase a specific package (used by paywall for selected option).
   */
  const purchasePackage = async (pkg: PurchasesPackage): Promise<void> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setPlan(isPro ? 'pro' : 'free');
      if (!isPro) {
        throw new Error('Purchase completed but pro entitlement not active');
      }
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  };

  /**
   * Purchase Pro subscription
   * Attempts to purchase the first available package from current offerings
   */
  const purchasePro = async (): Promise<void> => {
    try {
      const result = await Purchases.getOfferings();
      if (!result?.current) {
        throw new Error('No offerings available');
      }
      const packageToPurchase =
        result.current.availablePackages.find(pkg => pkg.identifier.includes('annual')) ||
        result.current.availablePackages.find(pkg => pkg.identifier.includes('monthly')) ||
        result.current.availablePackages[0];
      if (!packageToPurchase) {
        throw new Error('No packages available for purchase');
      }
      await purchasePackage(packageToPurchase);
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      throw error;
    }
  };

  const restorePurchases = async (): Promise<void> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setPlan(isPro ? 'pro' : 'free');
      if (!isPro) {
        throw new Error('No active subscription found');
      }
    } catch (error: any) {
      throw error;
    }
  };

  // For testing: allow manual plan switching (overrides refreshEntitlements until user changes)
  const setPlanForTesting = (newPlan: Plan) => {
    setTestingOverride(newPlan);
    setPlan(newPlan);
  };

  /**
   * Present RevenueCat-hosted paywall (RevenueCatUI.presentPaywall).
   * Returns { unlocked, showCustomPaywall }. When RevenueCat UI fails (e.g. Error 23), showCustomPaywall is true so caller can show custom /paywall.
   */
  const presentPaywall = async (): Promise<{ unlocked: boolean; showCustomPaywall: boolean }> => {
    const extra = Constants.expoConfig?.extra || {};
    if (extra.skipRevenueCat) {
      return { unlocked: false, showCustomPaywall: true };
    }
    try {
      const result = await presentRevenueCatPaywall();
      if (result === 'purchased' || result === 'restored') {
        await refreshEntitlements();
        return { unlocked: true, showCustomPaywall: false };
      }
      if (result === 'error') {
        return { unlocked: false, showCustomPaywall: true };
      }
      return { unlocked: false, showCustomPaywall: false };
    } catch {
      return { unlocked: false, showCustomPaywall: true };
    }
  };

  const value: RevenueCatContextType = {
    plan: testingOverride ?? plan,
    offerings,
    loadingOfferings,
    refreshEntitlements,
    fetchOfferings,
    purchasePro,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    setPlanForTesting,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

/**
 * Hook to access RevenueCat context
 * @returns RevenueCatContextType
 * @throws Error if used outside RevenueCatProvider
 */
export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
