import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ReactNode, useEffect, useState } from 'react';
import { Alert, FlatList, Linking, ScrollView, Share, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, LandscapeCard } from '@/components/car-cards';
import { Glass, GlassCircle, IconName, MessageState, PillButton, SectionHeader, Skeleton, T, Tap } from '@/components/ui';
import { CarListing, CarMedia, ConditionReport, useCar, useCars, useStoreSettings } from '@/lib/api';
import { conditionLabel, mileage, naira, nairaShort, overallLabel } from '@/lib/format';
import { colors, radius, screenPadding, space } from '@/theme/tokens';

const carName = (c: CarListing) => `${c.year} ${c.brand_name} ${c.model}${c.trim ? ` ${c.trim}` : ''}`;

// Buying, reserving and saving land in slices 2–4. Until then, say so plainly.
const comingSoon = (what: string) => Alert.alert(what, 'This arrives in the next build. For now, message a SarkinMota advisor on WhatsApp.');

function GalleryVideo({ item, active }: { item: CarMedia; active: boolean }) {
  const player = useVideoPlayer(item.url, (p) => {
    p.loop = false;
  });
  useEffect(() => {
    if (!active) player.pause();
  }, [player, active]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls />;
}

function Gallery({ media, height }: { media: CarMedia[]; height: number }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  return (
    <View style={{ height, backgroundColor: colors.surface }}>
      <FlatList
        data={media}
        horizontal
        pagingEnabled
        keyExtractor={(m) => m.id}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {item.kind === 'video' ? (
              <GalleryVideo item={item} active={i === index} />
            ) : (
              <Image source={{ uri: item.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            )}
          </View>
        )}
      />
      <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent']} style={styles.galleryTopShade} pointerEvents="none" />
      {media.length > 1 ? (
        <View style={styles.counter} pointerEvents="none">
          <Glass style={styles.counterPill}>
            <T variant="caption" style={{ fontWeight: '600' }}>
              {index + 1} / {media.length}
            </T>
          </Glass>
        </View>
      ) : null}
    </View>
  );
}

function Card({ icon, title, right, children }: { icon: IconName; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Ionicons name={icon} size={20} color={colors.gold} />
        <T variant="headline" style={{ flex: 1 }}>
          {title}
        </T>
        {right}
      </View>
      {children}
    </View>
  );
}

function CheckLine({ ok, text }: { ok: boolean; text: string }) {
  return (
    <View style={styles.checkLine}>
      <Ionicons name={ok ? 'checkmark-circle' : 'alert-circle'} size={18} color={ok ? colors.success : colors.warning} />
      <T variant="subhead" style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

function ConditionCard({ report }: { report: ConditionReport | null }) {
  const [open, setOpen] = useState(false);
  if (!report) {
    return (
      <Card icon="shield-checkmark" title="Condition report">
        <T variant="subhead" color={colors.textSecondary}>
          Inspection in progress. Ask an advisor for a live video walkaround.
        </T>
      </Card>
    );
  }
  const passed = report.items.filter((i) => i.status === 'pass').length;
  const sections = [...new Set(report.items.map((i) => i.section))];
  return (
    <Card icon="shield-checkmark" title="Condition report" right={<Badge label={overallLabel[report.overall]} tone="gold" />}>
      {report.summary ? <T variant="subhead">{report.summary}</T> : null}
      <T variant="footnote" color={colors.textSecondary} style={{ marginTop: space.sm }}>
        {passed} of {report.items.length} checks passed · Inspected {new Date(report.inspected_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        {report.inspector ? ` by ${report.inspector}` : ''}
      </T>
      <View style={{ marginTop: space.md, gap: space.sm }}>
        <CheckLine ok={report.accident_history === 'none_reported'} text={report.accident_history === 'none_reported' ? 'No accident history reported' : report.accident_history} />
        {report.disclosed_issues.map((issue) => (
          <CheckLine key={issue} ok={false} text={issue} />
        ))}
      </View>
      {open
        ? sections.map((s) => (
            <View key={s} style={{ marginTop: space.lg }}>
              <T variant="footnote" color={colors.textSecondary} style={{ fontWeight: '700', letterSpacing: 1, marginBottom: space.sm }}>
                {s.toUpperCase()}
              </T>
              <View style={{ gap: space.sm }}>
                {report.items
                  .filter((i) => i.section === s)
                  .map((i) => (
                    <CheckLine key={i.item} ok={i.status === 'pass'} text={i.note ? `${i.item}: ${i.note}` : i.item} />
                  ))}
              </View>
            </View>
          ))
        : null}
      <Tap onPress={() => setOpen((o) => !o)} style={{ marginTop: space.lg }} accessibilityLabel={open ? 'Hide full report' : 'See full report'}>
        <T variant="subhead" color={colors.gold} style={{ fontWeight: '600' }}>
          {open ? 'Hide full report' : `See all ${report.items.length} checks`}
        </T>
      </Tap>
    </Card>
  );
}

function Spec({ label, value }: { label: string; value: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.spec}>
      <T variant="caption" color={colors.textSecondary}>
        {label}
      </T>
      <T variant="subhead" style={{ fontWeight: '600', marginTop: 2 }}>
        {String(value)}
      </T>
    </View>
  );
}

function ContactRow({ icon, title, body, onPress }: { icon: IconName; title: string; body: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={title}>
      <View style={styles.contactRow}>
        <View style={styles.contactIcon}>
          <Ionicons name={icon} size={20} color={colors.gold} />
        </View>
        <View style={{ flex: 1 }}>
          <T variant="headline">{title}</T>
          <T variant="footnote" color={colors.textSecondary}>
            {body}
          </T>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Tap>
  );
}

export default function CarPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data, isError, refetch } = useCar(id);
  const { data: settings } = useStoreSettings();
  const similar = useCars({ category: data?.car.category_slug, excludeId: id, limit: 8 });

  const galleryHeight = Math.round(Math.min(height * 0.5, width * 0.9));

  const whatsapp = (message: string) => {
    if (!settings?.whatsapp_number) {
      Alert.alert('Advisor line not set up yet', 'The SarkinMota WhatsApp number has not been added to the app yet.');
      return;
    }
    Linking.openURL(`https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`);
  };

  const back = (
    <View style={[styles.navBar, { top: insets.top + space.xs }]} pointerEvents="box-none">
      <GlassCircle icon="chevron-back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      {data ? (
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <GlassCircle icon="share-outline" label="Share" onPress={() => Share.share({ message: `${carName(data.car)} at SarkinMota: ${naira(data.car.price_ngn)}` })} />
          <GlassCircle icon="heart-outline" label="Save" onPress={() => comingSoon('Save this car')} />
        </View>
      ) : null}
    </View>
  );

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <MessageState icon="cloud-offline" title="Can't load this car" body="It may have been sold, or you're offline." action={{ label: 'Try again', onPress: () => refetch() }} />
        {back}
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Skeleton style={{ height: galleryHeight, borderRadius: 0 }} />
        <View style={{ padding: screenPadding, gap: space.md }}>
          <Skeleton style={{ height: 18, width: '40%' }} />
          <Skeleton style={{ height: 32, width: '80%' }} />
          <Skeleton style={{ height: 24, width: '50%' }} />
        </View>
        {back}
      </View>
    );
  }

  const { car, media, report } = data;
  const sold = car.status !== 'available';
  const pct = Number(car.deposit_percent);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 140 + insets.bottom }}>
        <Gallery media={media} height={galleryHeight} />

        {/* Identity & price */}
        <View style={styles.block}>
          <T variant="footnote" color={colors.gold} style={{ fontWeight: '700', letterSpacing: 1.5 }}>
            {car.brand_name.toUpperCase()} · {car.category_name.toUpperCase()}
          </T>
          <T variant="title1" style={{ marginTop: space.xs }}>
            {car.model}
            {car.trim ? ` ${car.trim}` : ''}
          </T>
          <T variant="subhead" color={colors.textSecondary} style={{ marginTop: space.xs }}>
            {car.year} · {conditionLabel[car.condition]} · {mileage(car.mileage_km)} · {car.location_city}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md }}>
            {car.status === 'reserved' ? <Badge label="Reserved by another buyer" tone="muted" /> : null}
            {car.scarcity_note ? <Badge label={car.scarcity_note} tone="gold" /> : null}
          </View>
          <T variant="title2" style={{ marginTop: space.lg }}>
            {naira(car.price_ngn)}
          </T>
          {car.deposit_ngn ? (
            <T variant="subhead" color={colors.gold} style={{ marginTop: 2 }}>
              or {naira(car.deposit_ngn)} today ({pct}%), the balance later
            </T>
          ) : null}
          {car.headline ? (
            <T variant="body" color={colors.textSecondary} style={{ marginTop: space.lg }}>
              {car.headline}
            </T>
          ) : null}
        </View>

        {/* Trust stack: answers "is it real, what condition, are the papers clean, what do I get, how does it reach me" */}
        <View style={[styles.block, { gap: space.md }]}>
          <ConditionCard report={report} />

          <Card icon="document-text" title="Papers">
            <View style={{ gap: space.sm }}>
              <CheckLine ok={car.customs_cleared} text={car.customs_cleared ? 'Customs duty paid and verified' : 'Customs clearance in progress'} />
              <CheckLine
                ok={car.registration_status !== 'unregistered'}
                text={
                  car.registration_status === 'included'
                    ? 'Registration & plates included in the price'
                    : car.registration_status === 'registered'
                      ? 'Already registered'
                      : 'Not yet registered (we can register it for you)'
                }
              />
              {car.papers_included.map((p) => (
                <CheckLine key={p} ok text={p} />
              ))}
              {car.vin_last6 ? (
                <T variant="footnote" color={colors.textSecondary} style={{ marginTop: space.xs }}>
                  VIN ending {car.vin_last6}. Check it against the papers on delivery.
                </T>
              ) : null}
            </View>
          </Card>

          {car.included.length ? (
            <Card icon="gift" title="What's included">
              <View style={{ gap: space.sm }}>
                {car.included.map((i) => (
                  <CheckLine key={i} ok text={i} />
                ))}
              </View>
            </Card>
          ) : null}

          <Card icon="car" title="Delivery to your door">
            <T variant="subhead">{car.delivery_estimate ?? 'Delivery time confirmed at checkout.'}</T>
            <T variant="footnote" color={colors.textSecondary} style={{ marginTop: space.sm }}>
              Track every step in Orders. On arrival you check the car against this page before confirming.
            </T>
          </Card>
        </View>

        {/* Not ready to commit: lower-commitment steps */}
        <View style={styles.block}>
          <SectionHeader title="Not ready yet?" style={{ marginBottom: space.md }} />
          <View style={styles.contactGroup}>
            <ContactRow icon="logo-whatsapp" title="Ask an advisor" body="Chat with SarkinMota on WhatsApp" onPress={() => whatsapp(`Hello SarkinMota, I'm interested in the ${carName(car)} (${naira(car.price_ngn)}).`)} />
            <View style={styles.divider} />
            <ContactRow icon="videocam" title="See it live on video" body="Book a video call walkaround of this car" onPress={() => whatsapp(`Hello SarkinMota, I'd like a live video call to see the ${carName(car)}. When is a good time?`)} />
            <View style={styles.divider} />
            <ContactRow icon="time" title="Reserve it" body="Hold this car while you decide" onPress={() => comingSoon('Reserve this car')} />
            <View style={styles.divider} />
            <ContactRow
              icon="location"
              title="Visit the showroom"
              body={settings?.showroom_address ?? 'Central Business District, Abuja'}
              onPress={() => (settings?.showroom_maps_url ? Linking.openURL(settings.showroom_maps_url) : Alert.alert('Showroom', settings?.showroom_address ?? 'Central Business District, Abuja'))}
            />
          </View>
        </View>

        {/* Specs */}
        <View style={styles.block}>
          <SectionHeader title="Specifications" style={{ marginBottom: space.md }} />
          <View style={styles.specGrid}>
            <Spec label="Engine" value={car.engine} />
            <Spec label="Power" value={car.horsepower ? `${car.horsepower} hp` : null} />
            <Spec label="Transmission" value={car.transmission} />
            <Spec label="Drivetrain" value={car.drivetrain} />
            <Spec label="Fuel" value={car.fuel} />
            <Spec label="Body" value={car.body_type} />
            <Spec label="Exterior" value={car.exterior_color} />
            <Spec label="Interior" value={car.interior_color} />
            <Spec label="Seats" value={car.seats} />
            <Spec label="Mileage" value={mileage(car.mileage_km)} />
          </View>
          {car.description ? (
            <T variant="body" color={colors.textSecondary} style={{ marginTop: space.lg }}>
              {car.description}
            </T>
          ) : null}
        </View>

        {similar.data?.length ? (
          <View style={{ marginTop: space.xxl }}>
            <SectionHeader title={`More ${car.category_name}`} style={{ paddingHorizontal: screenPadding, marginBottom: space.md }} />
            <FlatList
              horizontal
              data={similar.data}
              keyExtractor={(c) => c.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: screenPadding, gap: space.md }}
              renderItem={({ item }) => <LandscapeCard car={item} width={Math.min(width * 0.7, 340)} />}
            />
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky purchase bar */}
      <Glass style={[styles.buyBar, { paddingBottom: insets.bottom + space.sm }]}>
        <View style={{ flex: 1 }}>
          <T variant="headline" lines={1}>
            {nairaShort(car.price_ngn)}
          </T>
          {car.deposit_ngn ? (
            <T variant="caption" color={colors.gold} lines={1}>
              or {nairaShort(car.deposit_ngn)} today
            </T>
          ) : null}
        </View>
        {sold ? (
          <PillButton label="Get notified" variant="glass" compact onPress={() => comingSoon('Get notified')} />
        ) : (
          <>
            {car.deposit_ngn ? <PillButton label={`Pay ${pct}%`} variant="gold" compact onPress={() => comingSoon(`Pay ${pct}% now`)} /> : null}
            <PillButton label="Buy now" compact onPress={() => comingSoon('Buy now')} />
          </>
        )}
      </Glass>

      {back}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: { position: 'absolute', left: screenPadding, right: screenPadding, flexDirection: 'row', justifyContent: 'space-between' },
  galleryTopShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  counter: { position: 'absolute', bottom: space.md, right: space.md },
  counterPill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, overflow: 'hidden' },
  block: { paddingHorizontal: screenPadding, marginTop: space.xxl },
  card: { backgroundColor: colors.surface, borderRadius: radius.tile, padding: space.lg },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  checkLine: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  contactGroup: { backgroundColor: colors.surface, borderRadius: radius.tile, overflow: 'hidden' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg },
  contactIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(214,181,72,0.12)', alignItems: 'center', justifyContent: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 68 },
  specGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.surface, borderRadius: radius.tile, padding: space.sm },
  spec: { width: '50%', padding: space.sm },
  buyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: screenPadding,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
});
