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
 * RevenueCat Provider - Stub for preview/internal builds
 *
 * Used when app is sideloaded (not from Play Store). react-native-purchases
 * can crash when the app isn't distributed via the store. This stub provides
 * free plan only - no native Purchases SDK is loaded.
 */
export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const { user } = useSupabase();
  const [plan, setPlan] = useState<Plan>('free');

  const refreshEntitlements = async (): Promise<void> => {
    // In stub, we just sync the current local plan to Supabase if logged in
    if (user?.id) {
      try {
        await updateProfile({ plan });
      } catch (e) {
        console.warn('[RevenueCat Stub] Failed to sync plan:', e);
      }
    }
  };

  useEffect(() => {
    if (user?.id) refreshEntitlements();
  }, [user?.id, plan]);

  const purchasePro = async (): Promise<void> => {
    throw new Error(
      'Purchases are only available in the store version. Install from Play Store to subscribe.'
    );
  };

  const purchasePackage = async (): Promise<void> => {
    throw new Error(
      'Purchases are only available in the store version. Install from Play Store to subscribe.'
    );
  };

  const restorePurchases = async (): Promise<void> => {
    throw new Error('Restore is only available in the store version.');
  };

  // Allow plan switching in stub (preview builds) so testers can try Pro features without real purchase
  const setPlanForTesting = async (newPlan: Plan) => {
    setPlan(newPlan);
    if (user?.id) {
      try {
        await updateProfile({ plan: newPlan });
      } catch (e) {
        console.warn('[RevenueCat Stub] Failed to sync plan:', e);
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
