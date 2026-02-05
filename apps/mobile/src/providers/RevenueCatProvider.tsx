import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// @ts-ignore - react-native-purchases types will be available after package installation
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSupabase } from './SupabaseProvider';

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
  refreshEntitlements: () => Promise<void>;
  purchasePro: () => Promise<void>;
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
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RevenueCat SDK
  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
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

        // Configure RevenueCat
        await Purchases.configure({ apiKey });

        // Set user ID if authenticated
        if (user?.id) {
          await Purchases.logIn(user.id);
        }

        // Load initial entitlements
        await refreshEntitlements();
        setIsInitialized(true);
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
   * Purchase Pro subscription
   * Attempts to purchase the first available package from current offerings
   */
  const purchasePro = async (): Promise<void> => {
    try {
      const offerings: PurchasesOffering | null = await Purchases.getOfferings();
      
      if (!offerings?.current) {
        throw new Error('No offerings available');
      }

      // Try to find a package (you can customize this logic)
      // Common identifiers: '$rc_monthly', '$rc_annual', etc.
      let packageToPurchase: PurchasesPackage | null = null;

      // Prefer annual, then monthly
      packageToPurchase = 
        offerings.current.availablePackages.find(pkg => pkg.identifier.includes('annual')) ||
        offerings.current.availablePackages.find(pkg => pkg.identifier.includes('monthly')) ||
        offerings.current.availablePackages[0]; // Fallback to first available

      if (!packageToPurchase) {
        throw new Error('No packages available for purchase');
      }

      // Make the purchase
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      // Update plan based on entitlements
      const isPro = customerInfo.entitlements.active['pro'] !== undefined;
      setPlan(isPro ? 'pro' : 'free');

      if (!isPro) {
        throw new Error('Purchase completed but pro entitlement not active');
      }
    } catch (error: any) {
      // Handle user cancellation gracefully
      if (error.userCancelled) {
        throw new Error('Purchase cancelled');
      }
      
      // Re-throw other errors
      throw error;
    }
  };

  // For testing: allow manual plan switching (only in development)
  const setPlanForTesting = (newPlan: Plan) => {
    if (__DEV__) {
      setPlan(newPlan);
    } else {
      console.warn('setPlanForTesting is only available in development mode');
    }
  };

  const value: RevenueCatContextType = {
    plan,
    refreshEntitlements,
    purchasePro,
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
