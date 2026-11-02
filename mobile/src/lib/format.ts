// Naira formatting done by hand so output is identical on Hermes iOS/Android regardless of Intl data.

function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** ₦85,000,000 */
export function naira(amount: number): string {
  return `₦${groupThousands(amount)}`;
}

/** ₦85m · ₦1.2bn · ₦950k */
export function nairaShort(amount: number): string {
  const trim = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''));
  if (amount >= 1e9) return `₦${trim(amount / 1e9)}bn`;
  if (amount >= 1e6) return `₦${trim(amount / 1e6)}m`;
  if (amount >= 1e3) return `₦${trim(amount / 1e3)}k`;
  return naira(amount);
}

/** 12,400 km · 0 km shows as "Brand new" */
export function mileage(km: number): string {
  return km === 0 ? '0 km' : `${groupThousands(km)} km`;
}

export const conditionLabel: Record<string, string> = {
  brand_new: 'Brand new',
  foreign_used: 'Foreign used',
  nigerian_used: 'Nigerian used',
};

export const overallLabel: Record<string, string> = {
  excellent: 'Excellent',
  very_good: 'Very good',
  good: 'Good',
  fair: 'Fair',
};
