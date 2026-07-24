import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { NinouLoadingScreen } from '@/components/guest-entry-portal';
import { SubscriptionAccessPortal } from '@/components/subscription-access-portal';
import { observeFamilySubscription, type FamilySubscription } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';

export function SubscriptionGate({ children }: PropsWithChildren) {
  const { access } = useNinouAuth();
  const [result, setResult] = useState<{ familyId: string; subscription: FamilySubscription | null; loaded: boolean }>({ familyId: '', subscription: null, loaded: false });
  const [checking, setChecking] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const familyId = access?.familyId || '';

  useEffect(() => {
    if (!familyId) return;
    const stop = observeFamilySubscription(familyId, (next) => {
      setResult({ familyId, subscription: next, loaded: true });
      setChecking(false);
    }, () => {
      setResult({ familyId, subscription: null, loaded: true });
      setChecking(false);
    });
    return stop;
  }, [familyId, retryKey]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const subscription = result.familyId === familyId ? result.subscription : null;
  const loading = Boolean(familyId) && (result.familyId !== familyId || !result.loaded);
  const blocked = useMemo(() => {
    if (!subscription) return false;
    const suspended = subscription.plan === 'suspended' || subscription.status === 'suspended';
    const expired = subscription.validUntil > 0 && subscription.validUntil <= now;
    return suspended || expired;
  }, [now, subscription]);

  if (loading) return <NinouLoadingScreen />;
  if (blocked && subscription) {
    return <SubscriptionAccessPortal subscription={subscription} checking={checking} onRetry={() => { setChecking(true); setRetryKey((value) => value + 1); }} />;
  }
  return children;
}
