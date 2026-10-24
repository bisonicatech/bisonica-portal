import { Platform } from 'react-native';
import Purchases, { CustomerInfo, PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

// Clocka Premium is sold through the App Store and managed with RevenueCat.
// Without a RevenueCat key (web, tests, or before it's set up) purchases are unavailable.
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const KEY = Platform.OS === 'ios' ? IOS_KEY : Platform.OS === 'android' ? ANDROID_KEY : undefined;

/** The RevenueCat entitlement that unlocks Premium. */
const ENTITLEMENT = 'premium';

export const purchasesEnabled = !!KEY;

export const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
export const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || '';

let configuredFor: string | null = null;

/**
 * Set up purchases for a household. The subscription belongs to the household,
 * so any of its family members' phones can see and restore it.
 */
export async function setupPurchases(householdCode: string) {
  if (!purchasesEnabled || !householdCode) return;
  const userId = `household_${householdCode}`;
  if (configuredFor === userId) return;
  if (configuredFor === null) Purchases.configure({ apiKey: KEY!, appUserID: userId });
  else await Purchases.logIn(userId);
  configuredFor = userId;
}

export type Plans = { monthly?: PurchasesPackage; yearly?: PurchasesPackage };

export async function getPlans(): Promise<Plans> {
  const offerings = await Purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  return {
    monthly: pkgs.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY),
    yearly: pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL),
  };
}

/** When Premium ends for this customer, or null if they don't have it. */
export function premiumUntil(info: CustomerInfo): Date | null {
  const ent = info.entitlements.active[ENTITLEMENT];
  if (!ent) return null;
  // Lifetime or non-expiring purchases: treat as far in the future.
  return ent.expirationDate ? new Date(ent.expirationDate) : new Date('2100-01-01T00:00:00Z');
}

export async function buy(pkg: PurchasesPackage): Promise<Date | null> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return premiumUntil(customerInfo);
}

export async function restore(): Promise<Date | null> {
  return premiumUntil(await Purchases.restorePurchases());
}

export async function currentPremiumUntil(): Promise<Date | null> {
  if (!purchasesEnabled || !configuredFor) return null;
  return premiumUntil(await Purchases.getCustomerInfo());
}

/** True when the person closed the App Store sheet without buying. */
export const wasCancelled = (e: unknown) => !!(e as { userCancelled?: boolean })?.userCancelled;
