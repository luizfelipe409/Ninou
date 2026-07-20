function toMilliseconds(value) {
  if (value === null || typeof value === "undefined" || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 100000000000) return value;
    if (value > 1000000000) return value * 1000;
    return value;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
    return Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeCommercialSubscription(data = {}, now = Date.now()) {
  const familyStatus = String(data.status || "active").trim().toLowerCase();
  const explicitPlan = String(data.subscriptionPlan || data.plan || "").trim().toLowerCase();
  const plan = explicitPlan || "legacy";
  const subscriptionStatus = String(data.subscriptionStatus || "active").trim().toLowerCase();
  const until = toMilliseconds(plan === "trial"
    ? (data.trialEndsAtClient || data.trialEndsAt)
    : (data.premiumUntilClient || data.premiumUntil));

  let reason = "active";
  if (["suspended", "archived", "blocked", "inactive"].includes(familyStatus)) {
    reason = "family_suspended";
  } else if (plan === "suspended" || ["suspended", "expired", "cancelled"].includes(subscriptionStatus)) {
    reason = "subscription_suspended";
  } else if (until && until <= now) {
    reason = "expired";
  }

  const labels = {
    trial: "Período de teste",
    premium: "Plano Premium",
    courtesy: "Acesso cortesia",
    suspended: "Acesso suspenso",
    legacy: "Acesso familiar",
  };

  return {
    allowed: reason === "active",
    reason,
    plan,
    planLabel: labels[plan] || "Acesso familiar",
    until,
    familyStatus,
    subscriptionStatus,
    raw: data,
  };
}
