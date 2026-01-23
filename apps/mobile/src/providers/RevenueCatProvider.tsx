import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Plan = 'free' | 'pro';

interface RevenueCatContextType {
  plan: Plan;
  refreshEntitlements: () => Promise<void>;
  purchasePro: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

/**
 * RevenueCat Provider
 * 
 * Provides subscription plan state and purchase methods.
 * 
 * TODO: Replace hardcoded logic with real RevenueCat SDK integration
 * For now, hardcoded to 'pro' to allow development of gating logic.
 */
export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  // Hardcoded to 'pro' for now - will be replaced with real RevenueCat SDK
  const [plan, setPlan] = useState<Plan>('pro');

  /**
   * Refresh entitlements from RevenueCat
   * Placeholder for now - will call RevenueCat SDK
   */
  const refreshEntitlements = async (): Promise<void> => {
    // TODO: Implement with RevenueCat SDK
    // const customerInfo = await Purchases.getCustomerInfo();
    // const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    // setPlan(isPro ? 'pro' : 'free');
    
    // For now, keep hardcoded 'pro'
    console.log('Refreshing entitlements (placeholder)');
  };

  /**
   * Purchase Pro subscription
   * Placeholder for now - will call RevenueCat SDK
   */
  const purchasePro = async (): Promise<void> => {
    // TODO: Implement with RevenueCat SDK
    // const offerings = await Purchases.getOfferings();
    // const package = offerings.current?.availablePackages.find(p => p.identifier === 'pro');
    // if (package) {
    //   const { customerInfo } = await Purchases.purchasePackage(package);
    //   const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    //   setPlan(isPro ? 'pro' : 'free');
    // }
    
    // For now, just log
    console.log('Purchasing Pro (placeholder)');
  };

  const value: RevenueCatContextType = {
    plan,
    refreshEntitlements,
    purchasePro,
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
