import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { updateProfile } from '@/src/lib/api';

export type Plan = 'free' | 'pro';

interface RevenueCatContextType {
  plan: Plan;
  offerings: { current: unknown } | null;
  loadingOfferings: boolean;
  refreshEntitlements: () => Promise<void>;
  fetchOfferings: () => Promise<void>;
  purchasePro: () => Promise<void>;
  purchasePackage: (pkg: unknown) => Promise<void>;
  restorePurchases: () => Promise<void>;
  presentPaywall: () => Promise<{ unlocked: boolean; showCustomPaywall: boolean }>;
  setPlanForTesting?: (plan: Plan) => void;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

/**
 * RevenueCat Provider - Web implementation
 *
 * react-native-purchases is not available on web. This provides a mock implementation
 * that always returns 'free' plan. Purchases must be done on iOS/Android native apps.
 */
export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useSupabase();
  const [plan, setPlan] = useState<Plan>('free');

  const refreshEntitlements = async (): Promise<void> => {
    // Sync local plan to Supabase if logged in
    if (user?.id) {
      try {
        await updateProfile({ plan });
      } catch (e) {
        console.warn('[RevenueCat Web] Failed to sync plan:', e);
      }
    }
  };

  useEffect(() => {
    if (user?.id) refreshEntitlements();
  }, [user?.id, plan]);

  const purchasePro = async (): Promise<void> => {
    throw new Error(
      'In-app purchases are not available on web. Please use the iOS or Android app to subscribe.'
    );
  };

  const purchasePackage = async (): Promise<void> => {
    throw new Error(
      'In-app purchases are not available on web. Please use the iOS or Android app to subscribe.'
    );
  };

  const restorePurchases = async (): Promise<void> => {
    throw new Error('Restore is not available on web.');
  };

  const setPlanForTesting = async (newPlan: Plan) => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      setPlan(newPlan);
      if (user?.id) {
        try {
          await updateProfile({ plan: newPlan });
        } catch (e) {
          console.warn('[RevenueCat Web] Failed to sync plan:', e);
        }
      }
    }
  };

  const presentPaywall = async () => ({ unlocked: false, showCustomPaywall: true });

  const value: RevenueCatContextType = {
    plan,
    offerings: null,
    loadingOfferings: false,
    refreshEntitlements,
    fetchOfferings: async () => {},
    purchasePro,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    setPlanForTesting,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
}

export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}
