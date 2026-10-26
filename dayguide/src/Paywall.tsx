import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { Household, getHousehold, setPremium } from './family';
import { PRIVACY_URL, TERMS_URL, buy, getPlans, purchasesEnabled, restore, setupPurchases, wasCancelled, type Plans } from './purchases';
import { Button, Screen, form } from './ui';

type Props = {
  code: string;
  /** The household's internal ID, used as the RevenueCat customer ID. */
  householdId: string;
  patient: string;
  onClose: () => void;
  onPremium: (h: Household) => void;
};

const FEATURES = [
  ['📅', 'Unlimited daily times', 'and a different schedule for each day of the week'],
  ['👪', 'Unlimited family members', 'everyone sees the same screens'],
  ['💬', 'Your own messages', 'write your own Out message, or send a message to their screen at any time'],
  ['📞', 'Extra call buttons', 'for other family members or friends'],
  ['🎥', 'Video call button', 'one tap to FaceTime one person'],
];

export default function Paywall({ code, householdId, patient, onClose, onPremium }: Props) {
  const [plans, setPlans] = useState<Plans | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!purchasesEnabled) return;
    if (!householdId) return setError("Couldn't load prices. The server needs updating (0009_security.sql).");
    setupPurchases(householdId)
      .then(getPlans)
      .then(setPlans)
      .catch(() => setError("Couldn't load prices from the App Store. Check the internet connection and try again."));
  }, [householdId]);

  const finish = async (until: Date | null) => {
    if (!until) return setError('No active Clocka Premium subscription was found.');
    // Older servers record Premium here; newer ones ignore this and wait for RevenueCat.
    let h = await setPremium(code, until);
    // Clocka's server hears about the purchase from RevenueCat, usually within seconds.
    setWaiting(true);
    for (let i = 0; i < 15 && h.is_premium === false; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      h = await getHousehold(code).catch(() => h);
    }
    setWaiting(false);
    if (h.is_premium === false) {
      return setError('Thank you! Your purchase went through. Premium will switch on within a few minutes.');
    }
    onPremium(h);
  };

  const purchase = async (pkg: PurchasesPackage) => {
    setBusy(true);
    setError('');
    try {
      await finish(await buy(pkg));
    } catch (e) {
      if (!wasCancelled(e)) setError((e as Error).message || 'The purchase did not go through.');
    } finally {
      setBusy(false);
    }
  };

  const doRestore = async () => {
    setBusy(true);
    setError('');
    try {
      await finish(await restore());
    } catch (e) {
      setError((e as Error).message || "Couldn't restore purchases.");
    } finally {
      setBusy(false);
    }
  };

  const trialText = (pkg?: PurchasesPackage) => {
    const intro = pkg?.product.introPrice;
    return intro && intro.price === 0 ? `${intro.periodNumberOfUnits} ${intro.periodUnit.toLowerCase()} free, then ` : '';
  };

  return (
    <Screen>
      <Pressable onPress={onClose} hitSlop={12}>
        <Text style={[form.hint, { color: '#1f3b73', fontWeight: '600' }]}>‹ Back</Text>
      </Pressable>
      <Text style={form.h1}>Clocka Premium</Text>
      <Text style={form.hint}>Everything in the free plan, plus more ways to help {patient}.</Text>

      {FEATURES.map(([icon, title, sub]) => (
        <View key={title} style={styles.feature}>
          <Text style={styles.featureIcon}>{icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={form.hint}>{sub}</Text>
          </View>
        </View>
      ))}

      {!purchasesEnabled ? (
        <Text style={form.warn}>Subscriptions aren't available in this version of the app yet.</Text>
      ) : !plans ? (
        error ? null : <ActivityIndicator style={{ marginTop: 20 }} />
      ) : (
        <>
          {plans.yearly && (
            <Pressable disabled={busy} onPress={() => purchase(plans.yearly!)} style={[styles.plan, styles.best]}>
              <Text style={styles.planBadge}>BEST VALUE</Text>
              <Text style={styles.planTitle}>{plans.yearly.product.priceString} a year</Text>
              <Text style={styles.planSub}>{trialText(plans.yearly)}billed yearly</Text>
            </Pressable>
          )}
          {plans.monthly && (
            <Pressable disabled={busy} onPress={() => purchase(plans.monthly!)} style={styles.plan}>
              <Text style={[styles.planTitle, { color: '#1f3b73' }]}>{plans.monthly.product.priceString} a month</Text>
              <Text style={[styles.planSub, { color: '#555' }]}>{trialText(plans.monthly)}billed monthly</Text>
            </Pressable>
          )}
          {busy && <ActivityIndicator style={{ marginTop: 12 }} />}
          {waiting && <Text style={form.hint}>Switching on Premium…</Text>}
        </>
      )}

      {!!error && <Text style={form.error}>{error}</Text>}
      {purchasesEnabled && <Button label="Restore purchases" onPress={doRestore} disabled={busy} />}

      <Text style={styles.small}>
        Premium covers the whole family: it works on every phone linked to {patient}. Payment is charged to your Apple ID. The
        subscription renews automatically unless cancelled at least 24 hours before the end of the current period. Manage or cancel
        it in Settings › your name › Subscriptions.
      </Text>
      <View style={form.row}>
        <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
          <Text style={styles.link}>Terms of Use</Text>
        </Pressable>
        {!!PRIVACY_URL && (
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Privacy Policy</Text>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  feature: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 10 },
  featureIcon: { fontSize: 26, width: 34, textAlign: 'center' },
  featureTitle: { fontSize: 17, fontWeight: '700', color: '#111' },
  plan: { borderWidth: 2, borderColor: '#1f3b73', borderRadius: 14, padding: 16, marginTop: 14, alignItems: 'center', backgroundColor: '#fff' },
  best: { backgroundColor: '#1f3b73' },
  planBadge: { color: '#ffd76a', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  planTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 2 },
  planSub: { color: '#dfe6f5', fontSize: 15, marginTop: 2 },
  small: { fontSize: 12, color: '#666', marginTop: 20, lineHeight: 17 },
  link: { color: '#1f3b73', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline', marginTop: 8 },
});
