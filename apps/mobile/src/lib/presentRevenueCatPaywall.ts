/**
 * Presents the RevenueCat-hosted paywall using react-native-purchases-ui.
 * See: https://www.revenuecat.com/docs/tools/paywalls/displaying-paywalls
 *
 * Use this when RevenueCat is configured (production build). When the user
 * purchases or restores, the caller should refresh entitlements.
 */
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

export type PresentPaywallResult = 'purchased' | 'restored' | 'cancelled' | 'error' | 'not_presented';

export async function presentRevenueCatPaywall(): Promise<PresentPaywallResult> {
  try {
    const result: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
        return 'purchased';
      case PAYWALL_RESULT.RESTORED:
        return 'restored';
      case PAYWALL_RESULT.CANCELLED:
        return 'cancelled';
      case PAYWALL_RESULT.ERROR:
        return 'error';
      case PAYWALL_RESULT.NOT_PRESENTED:
      default:
        return 'not_presented';
    }
  } catch (_) {
    return 'error';
  }
}
