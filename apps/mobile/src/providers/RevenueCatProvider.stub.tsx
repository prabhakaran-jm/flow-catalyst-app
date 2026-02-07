import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Plan = 'free' | 'pro';

interface RevenueCatContextType {
  plan: Plan;
  refreshEntitlements: () => Promise<void>;
  purchasePro: () => Promise<void>;
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
  const [plan, setPlan] = useState<Plan>('free');

  const refreshEntitlements = async (): Promise<void> => {
    setPlan('free');
  };

  const purchasePro = async (): Promise<void> => {
    throw new Error(
      'Purchases are only available in the store version. Install from Play Store to subscribe.'
    );
  };

  // Allow plan switching in stub (preview builds) so testers can try Pro features without real purchase
  const setPlanForTesting = (newPlan: Plan) => {
    setPlan(newPlan);
  };

  const value: RevenueCatContextType = {
    plan,
    refreshEntitlements,
    purchasePro,
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
