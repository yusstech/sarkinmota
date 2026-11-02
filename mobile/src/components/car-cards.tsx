import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { T, Tap } from '@/components/ui';
import type { CarListing } from '@/lib/api';
import { conditionLabel, mileage, nairaShort } from '@/lib/format';
import { colors, radius, space } from '@/theme/tokens';

const open = (id: string) => router.push({ pathname: '/car/[id]', params: { id } });

function StatusBadge({ car }: { car: CarListing }) {
  if (car.status === 'reserved') return <Badge label="Reserved" tone="muted" />;
  if (car.scarcity_note) return <Badge label={car.scarcity_note} tone="gold" />;
  return null;
}

export function Badge({ label, tone }: { label: string; tone: 'gold' | 'muted' }) {
  return (
    <View style={[styles.badge, tone === 'gold' ? { backgroundColor: colors.gold } : { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
      <T variant="caption" color={tone === 'gold' ? '#000' : colors.text} style={{ fontWeight: '600' }} lines={1}>
        {label}
      </T>
    </View>
  );
}

/** 16:10 card with caption below. Used for "Just arrived" and category rows. */
export function LandscapeCard({ car, width }: { car: CarListing; width: number }) {
  return (
    <Tap onPress={() => open(car.id)} style={{ width }} accessibilityLabel={`${car.year} ${car.brand_name} ${car.model}`}>
      <View style={[styles.media, { width, height: width * 0.625 }]}>
        {car.cover_url ? <Image source={{ uri: car.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
        <View style={styles.badgeSlot}>
          <StatusBadge car={car} />
        </View>
      </View>
      <View style={styles.caption}>
        <T variant="headline" lines={1}>
          {car.brand_name} {car.model}
        </T>
        <T variant="footnote" color={colors.textSecondary} lines={1}>
          {car.year} · {conditionLabel[car.condition]} · {mileage(car.mileage_km)}
        </T>
        <View style={styles.priceRow}>
          <T variant="subhead" style={{ fontWeight: '600' }}>
            {nairaShort(car.price_ngn)}
          </T>
          {car.deposit_ngn ? (
            <T variant="footnote" color={colors.gold}>
              or {nairaShort(car.deposit_ngn)} today
            </T>
          ) : null}
        </View>
      </View>
    </Tap>
  );
}

/** Tall card with the name over the image. Used for "Rare finds". */
export function PosterCard({ car, width }: { car: CarListing; width: number }) {
  return (
    <Tap onPress={() => open(car.id)} style={{ width }} accessibilityLabel={`${car.year} ${car.brand_name} ${car.model}`}>
      <View style={[styles.media, { width, height: width * 1.4 }]}>
        {car.cover_url ? <Image source={{ uri: car.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.posterShade} />
        <View style={styles.badgeSlot}>
          <StatusBadge car={car} />
        </View>
        <View style={styles.posterText}>
          <T variant="caption" color={colors.gold} style={{ fontWeight: '600', letterSpacing: 1 }} lines={1}>
            {car.brand_name.toUpperCase()}
          </T>
          <T variant="headline" lines={2}>
            {car.model}
          </T>
          <T variant="footnote" color={colors.textSecondary}>
            {nairaShort(car.price_ngn)}
          </T>
        </View>
      </View>
    </Tap>
  );
}

/** Two-column grid card for Browse. */
export function GridCard({ car, width }: { car: CarListing; width: number }) {
  return (
    <Tap onPress={() => open(car.id)} style={{ width }} accessibilityLabel={`${car.year} ${car.brand_name} ${car.model}`}>
      <View style={[styles.media, { width, height: width * 0.75 }]}>
        {car.cover_url ? <Image source={{ uri: car.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : null}
        <View style={styles.badgeSlot}>
          <StatusBadge car={car} />
        </View>
      </View>
      <View style={styles.caption}>
        <T variant="subhead" style={{ fontWeight: '600' }} lines={1}>
          {car.brand_name} {car.model}
        </T>
        <T variant="caption" color={colors.textSecondary} lines={1}>
          {car.year} · {mileage(car.mileage_km)}
        </T>
        <T variant="subhead" style={{ fontWeight: '600', marginTop: 2 }}>
          {nairaShort(car.price_ngn)}
        </T>
        {car.deposit_ngn ? (
          <T variant="caption" color={colors.gold}>
            or {nairaShort(car.deposit_ngn)} today
          </T>
        ) : null}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  media: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface },
  caption: { paddingTop: space.sm, gap: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm, marginTop: 2 },
  badgeSlot: { position: 'absolute', top: space.sm, left: space.sm, right: space.sm, flexDirection: 'row' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, maxWidth: '100%' },
  posterShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  posterText: { position: 'absolute', left: space.md, right: space.md, bottom: space.md, gap: 2 },
});
