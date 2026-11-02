import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { PillButton, T } from '@/components/ui';
import type { HeroSlide } from '@/lib/api';
import { conditionLabel, mileage, nairaShort } from '@/lib/format';
import { colors, space } from '@/theme/tokens';

const IMAGE_DWELL_MS = 6000;

function SlideVideo({ uri, poster, active, muted }: { uri: string; poster: string | null; active: boolean; muted: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);
  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [player, active]);
  return (
    <>
      {poster ? <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </>
  );
}

export function HeroCarousel({ slides, height, muted }: { slides: HeroSlide[]; height: number; muted: boolean }) {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<HeroSlide>>(null);
  const touching = useRef(false);

  // Image slides auto-advance; video slides advance on the same dwell (they loop until then).
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setTimeout(() => {
      if (touching.current) return;
      const next = (index + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, IMAGE_DWELL_MS);
    return () => clearTimeout(t);
  }, [index, slides.length]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) setIndex(first.index);
  }).current;

  return (
    <View style={{ height }}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        onScrollBeginDrag={() => (touching.current = true)}
        onScrollEndDrag={() => (touching.current = false)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {item.kind === 'video' ? (
              <SlideVideo uri={item.media_url} poster={item.poster_url} active={i === index} muted={muted} />
            ) : (
              <Image source={{ uri: item.media_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
            )}
            <LinearGradient colors={['rgba(0,0,0,0.75)', 'rgba(0,0,0,0.35)', 'transparent']} locations={[0, 0.6, 1]} style={styles.topShade} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', colors.bg]} locations={[0, 0.55, 1]} style={styles.bottomShade} />
            <View style={styles.copy}>
              {item.eyebrow ? (
                <T variant="footnote" color={colors.gold} style={styles.eyebrow}>
                  {item.eyebrow.toUpperCase()}
                </T>
              ) : null}
              <T variant="largeTitle" style={{ textAlign: 'center' }} lines={2}>
                {item.headline}
              </T>
              {item.car ? (
                <T variant="subhead" color={colors.textSecondary} style={{ textAlign: 'center' }}>
                  {item.car.year} · {conditionLabel[item.car.condition]} · {mileage(item.car.mileage_km)}
                </T>
              ) : item.subline ? (
                <T variant="subhead" color={colors.textSecondary} style={{ textAlign: 'center' }}>
                  {item.subline}
                </T>
              ) : null}
              {item.car ? (
                <T variant="callout" style={{ textAlign: 'center', marginTop: 2 }}>
                  {nairaShort(item.car.price_ngn)}
                  {item.car.deposit_ngn ? <T variant="callout" color={colors.gold}>{`  ·  or ${nairaShort(item.car.deposit_ngn)} today`}</T> : null}
                </T>
              ) : null}
              {item.car_id ? (
                <PillButton
                  label="View car"
                  style={{ marginTop: space.md, alignSelf: 'center' }}
                  onPress={() => router.push({ pathname: '/car/[id]', params: { id: item.car_id! } })}
                />
              ) : null}
            </View>
          </View>
        )}
      />
      {slides.length > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {slides.map((s, i) => (
            <View key={s.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topShade: { position: 'absolute', top: 0, left: 0, right: 0, height: 180 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  copy: { position: 'absolute', left: space.xl, right: space.xl, bottom: space.xxxl, alignItems: 'center', gap: 4 },
  eyebrow: { fontWeight: '700', letterSpacing: 1.5 },
  dots: { position: 'absolute', bottom: space.md, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotActive: { width: 18, backgroundColor: colors.text },
});
