import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, FlatList, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LandscapeCard, PosterCard } from '@/components/car-cards';
import { HeroCarousel } from '@/components/hero-carousel';
import { GlassCircle, MessageState, PillButton, SectionHeader, Skeleton, T, Tap } from '@/components/ui';
import { CarListing, useCars, useCategories, useDeliveryStories, useHeroSlides, useStoreSettings } from '@/lib/api';
import { nairaShort } from '@/lib/format';
import { colors, radius, screenPadding, space } from '@/theme/tokens';

const browse = (params: Record<string, string> = {}) => router.push({ pathname: '/browse', params });

function Row({ title, cars, kind, onSeeAll }: { title: string; cars: CarListing[] | undefined; kind: 'landscape' | 'poster'; onSeeAll?: () => void }) {
  const { width } = useWindowDimensions();
  const cardWidth = kind === 'landscape' ? Math.min(width * 0.72, 360) : Math.min(width * 0.42, 200);
  if (cars && cars.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title={title} onPress={onSeeAll} style={styles.sectionHeader} />
      {cars ? (
        <FlatList
          horizontal
          data={cars}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
          renderItem={({ item }) => (kind === 'landscape' ? <LandscapeCard car={item} width={cardWidth} /> : <PosterCard car={item} width={cardWidth} />)}
        />
      ) : (
        <View style={[styles.rowContent, { flexDirection: 'row' }]}>
          {[0, 1].map((i) => (
            <Skeleton key={i} style={{ width: cardWidth, height: kind === 'landscape' ? cardWidth * 0.625 + 70 : cardWidth * 1.4 }} />
          ))}
        </View>
      )}
    </View>
  );
}

/** Answers "can I trust buying a car I haven't seen?" before the customer has to ask. */
function TrustStrip() {
  const items: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string; body: string }[] = [
    { icon: 'shield-checkmark', title: 'Inspected', body: 'Every car has a condition report' },
    { icon: 'document-text', title: 'Papers verified', body: 'Customs cleared by our own team' },
    { icon: 'car', title: 'Delivered to you', body: 'Track it to your door' },
    { icon: 'lock-closed', title: 'Pay securely', body: 'Paystack only, never personal accounts' },
  ];
  return (
    <View style={[styles.section, { paddingHorizontal: screenPadding }]}>
      <T variant="title3" style={{ marginBottom: space.md }}>
        Buy from home, with confidence
      </T>
      <View style={styles.trustGrid}>
        {items.map((it) => (
          <View key={it.title} style={styles.trustItem}>
            <Ionicons name={it.icon} size={22} color={colors.gold} />
            <T variant="headline" style={{ marginTop: space.sm }}>
              {it.title}
            </T>
            <T variant="footnote" color={colors.textSecondary}>
              {it.body}
            </T>
          </View>
        ))}
      </View>
    </View>
  );
}

function PlanPromo({ example }: { example?: CarListing }) {
  const { data: settings } = useStoreSettings();
  const pct = settings?.deposit_percent ?? 40;
  return (
    <View style={[styles.section, { paddingHorizontal: screenPadding }]}>
      <LinearGradient colors={['#2A2208', '#0E0C05']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.promo}>
        <T variant="footnote" color={colors.gold} style={{ fontWeight: '700', letterSpacing: 1.5 }}>
          {pct}% NOW, THE REST LATER
        </T>
        <T variant="title2" style={{ marginTop: space.sm }}>
          Drive it home with {pct}%
        </T>
        <T variant="subhead" color={colors.textSecondary} style={{ marginTop: space.xs }}>
          {example?.deposit_ngn
            ? `Pay ${nairaShort(example.deposit_ngn)} today on the ${example.brand_name} ${example.model} and spread the balance.`
            : 'Pay part today and spread the balance.'}
        </T>
        <PillButton label={`See ${pct}% cars`} variant="gold" compact style={{ marginTop: space.lg, alignSelf: 'flex-start' }} onPress={() => browse({ plan: '1' })} />
      </LinearGradient>
    </View>
  );
}

function Categories() {
  const { data } = useCategories();
  if (!data) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title="Shop by category" style={styles.sectionHeader} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(c) => c.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        renderItem={({ item }) => (
          <Tap onPress={() => browse({ category: item.slug })} accessibilityLabel={item.name}>
            <View style={styles.categoryTile}>
              {item.image_url ? <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
              <T variant="headline" style={styles.categoryLabel}>
                {item.name}
              </T>
            </View>
          </Tap>
        )}
      />
    </View>
  );
}

function Delivered() {
  const { data } = useDeliveryStories();
  const { width } = useWindowDimensions();
  if (!data?.length) return null;
  const w = Math.min(width * 0.62, 300);
  return (
    <View style={styles.section}>
      <SectionHeader title="Delivered to SarkinMota owners" style={styles.sectionHeader} />
      <FlatList
        horizontal
        data={data}
        keyExtractor={(d) => d.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
        renderItem={({ item }) => (
          <View style={{ width: w }}>
            <View style={[styles.storyMedia, { width: w, height: w * 1.15 }]}>
              <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.storyPin}>
                <Ionicons name="location" size={12} color="#000" />
                <T variant="caption" color="#000" style={{ fontWeight: '600' }}>
                  {item.city}
                </T>
              </View>
            </View>
            <T variant="subhead" style={{ fontWeight: '600', marginTop: space.sm }} lines={1}>
              {item.car_label}
            </T>
            {item.caption ? (
              <T variant="footnote" color={colors.textSecondary} lines={2}>
                {item.caption}
              </T>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [muted, setMuted] = useState(true);
  const hero = useHeroSlides();
  const latest = useCars({ limit: 10 });
  const rare = useCars({ rare: true, limit: 10 });
  const executive = useCars({ category: 'executive-class', limit: 10 });
  const suvs = useCars({ category: 'premium-suvs', limit: 10 });
  const evs = useCars({ category: 'electric', limit: 10 });
  const [refreshing, setRefreshing] = useState(false);
  const heroHeight = Math.round(height * 0.62);
  // The brand bar floats over the hero; once the hero scrolls away it needs its own backdrop.
  const scrollY = useRef(new Animated.Value(0)).current;
  const barBackdrop = scrollY.interpolate({ inputRange: [heroHeight - 160, heroHeight - 80], outputRange: [0, 1], extrapolate: 'clamp' });

  const hasVideo = hero.data?.some((s) => s.kind === 'video');

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([hero.refetch(), latest.refetch(), rare.refetch(), executive.refetch(), suvs.refetch(), evs.refetch()]);
    setRefreshing(false);
  };

  if (latest.isError) {
    return <MessageState icon="cloud-offline" title="Can't reach SarkinMota" body="Check your connection and try again." action={{ label: 'Try again', onPress: refresh }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: space.xxxl * 2 }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.gold} progressViewOffset={insets.top} />}>
        {hero.data?.length ? (
          <HeroCarousel slides={hero.data} height={heroHeight} muted={muted} />
        ) : (
          <Skeleton style={{ height: heroHeight, borderRadius: 0 }} />
        )}
        <Row title="Just arrived" cars={latest.data} kind="landscape" onSeeAll={() => browse()} />
        <PlanPromo example={latest.data?.find((c) => c.deposit_ngn)} />
        <Categories />
        <Row title="Rare finds" cars={rare.data} kind="poster" />
        <Row title="Executive Class" cars={executive.data} kind="landscape" onSeeAll={() => browse({ category: 'executive-class' })} />
        <Row title="Premium SUVs" cars={suvs.data} kind="landscape" onSeeAll={() => browse({ category: 'premium-suvs' })} />
        <Row title="Electric" cars={evs.data} kind="poster" onSeeAll={() => browse({ category: 'electric' })} />
        <TrustStrip />
        <Delivered />
      </Animated.ScrollView>

      {/* Brand bar floats over the hero */}
      <View style={[styles.topBar, { paddingTop: insets.top + space.xs }]} pointerEvents="box-none">
        <Animated.View style={[StyleSheet.absoluteFill, styles.topBarBackdrop, { opacity: barBackdrop }]} pointerEvents="none" />
        <View>
          <T variant="headline" style={styles.wordmark}>
            SARKINMOTA
          </T>
          <T variant="caption" color={colors.gold} style={styles.wordmarkSub}>
            AUTOS
          </T>
        </View>
        {hasVideo ? <GlassCircle icon={muted ? 'volume-mute' : 'volume-high'} label={muted ? 'Unmute' : 'Mute'} onPress={() => setMuted((m) => !m)} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: space.xxl },
  sectionHeader: { paddingHorizontal: screenPadding, marginBottom: space.md },
  rowContent: { paddingHorizontal: screenPadding, gap: space.md },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: screenPadding, paddingBottom: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topBarBackdrop: { backgroundColor: colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.separator },
  wordmark: { fontWeight: '800', letterSpacing: 3 },
  wordmarkSub: { fontWeight: '700', letterSpacing: 6, marginTop: -2 },
  promo: { borderRadius: radius.sheet, padding: space.xl, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(214,181,72,0.35)' },
  categoryTile: { width: 150, height: 96, borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface, justifyContent: 'flex-end' },
  categoryLabel: { padding: space.md },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  trustItem: { width: '48%', flexGrow: 1, flexBasis: '45%', backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg },
  storyMedia: { borderRadius: radius.card, overflow: 'hidden', backgroundColor: colors.surface },
  storyPin: { position: 'absolute', top: space.sm, left: space.sm, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.gold, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
});
