import { type PropsWithChildren, useEffect, useMemo, useState } from 'react';

import { NinouLoadingScreen } from '@/components/guest-entry-portal';
import { SubscriptionAccessPortal } from '@/components/subscription-access-portal';
import { observeFamilySubscription, type FamilySubscription } from '@/services/firebase';
import { useNinouAuth } from '@/state/auth-context';

export function SubscriptionGate({ children }: PropsWithChildren) {
  const { access } = useNinouAuth();
  const [subscription, setSubscription] = useState<FamilySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!access?.familyId) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const stop = observeFamilySubscription(access.familyId, (next) => {
      setSubscription(next);
      setLoading(false);
      setChecking(false);
    }, () => {
      setLoading(false);
      setChecking(false);
    });
    return stop;
  }, [access?.familyId, retryKey]);

  const blocked = useMemo(() => {
    if (!subscription) return false;
    const suspended = subscription.plan === 'suspended' || subscription.status === 'suspended';
    const expired = subscription.validUntil > 0 && subscription.validUntil <= Date.now();
    return suspended || expired;
  }, [subscription]);

  if (loading) return <NinouLoadingScreen />;
  if (blocked && subscription) {
    return <SubscriptionAccessPortal subscription={subscription} checking={checking} onRetry={() => { setChecking(true); setRetryKey((value) => value + 1); }} />;
  }
  return children;
}
