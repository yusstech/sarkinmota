import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GridCard } from '@/components/car-cards';
import { MessageState, Skeleton, T, Tap } from '@/components/ui';
import { CarFilter, useCars, useCategories, useStoreSettings } from '@/lib/api';
import { colors, radius, screenPadding, space } from '@/theme/tokens';

const SORTS: { key: NonNullable<CarFilter['sort']>; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'price_asc', label: 'Price ↑' },
  { key: 'price_desc', label: 'Price ↓' },
];

function Chip({ label, active, onPress, icon }: { label: string; active: boolean; onPress: () => void; icon?: React.ComponentProps<typeof Ionicons>['name'] }) {
  return (
    <Tap onPress={onPress} accessibilityLabel={label}>
      <View style={[styles.chip, active && styles.chipActive]}>
        {icon ? <Ionicons name={icon} size={14} color={active ? '#000' : colors.text} /> : null}
        <T variant="subhead" color={active ? '#000' : colors.text} style={{ fontWeight: '600' }}>
          {label}
        </T>
      </View>
    </Tap>
  );
}

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function Browse() {
  const params = useLocalSearchParams<{ category?: string; plan?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>(params.category);
  const [plan, setPlan] = useState(params.plan === '1');
  const [sort, setSort] = useState<NonNullable<CarFilter['sort']>>('newest');

  // Deep links from Home (category tile, 40% promo) update the filters.
  useEffect(() => {
    if (params.category !== undefined) setCategory(params.category || undefined);
  }, [params.category]);
  useEffect(() => {
    if (params.plan !== undefined) setPlan(params.plan === '1');
  }, [params.plan]);

  const term = useDebounced(search, 300);
  const categories = useCategories();
  const { data: settings } = useStoreSettings();
  const cars = useCars({ search: term, category, plan, sort });

  const columns = width >= 700 ? 3 : 2; // the Fold's inner screen gets three columns
  const gap = space.md;
  const cardWidth = (width - screenPadding * 2 - gap * (columns - 1)) / columns;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: screenPadding }}>
        <T variant="largeTitle" style={{ marginTop: space.sm }}>
          Browse
        </T>
        <View style={styles.search}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Brand, model or category"
            placeholderTextColor={colors.textTertiary}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipScroller}>
        <Chip label={`${settings?.deposit_percent ?? 40}% available`} icon="wallet" active={plan} onPress={() => setPlan((p) => !p)} />
        <Chip label="All" active={!category} onPress={() => setCategory(undefined)} />
        {categories.data?.map((c) => (
          <Chip key={c.id} label={c.name} active={category === c.slug} onPress={() => setCategory(category === c.slug ? undefined : c.slug)} />
        ))}
      </ScrollView>

      <View style={styles.sortRow}>
        <T variant="footnote" color={colors.textSecondary}>
          {cars.data ? `${cars.data.length} car${cars.data.length === 1 ? '' : 's'}` : ' '}
        </T>
        <View style={{ flexDirection: 'row', gap: space.md }}>
          {SORTS.map((s) => (
            <Tap key={s.key} onPress={() => setSort(s.key)} accessibilityLabel={`Sort by ${s.label}`}>
              <T variant="footnote" color={sort === s.key ? colors.gold : colors.textSecondary} style={{ fontWeight: '600' }}>
                {s.label}
              </T>
            </Tap>
          ))}
        </View>
      </View>

      {cars.isError ? (
        <MessageState icon="cloud-offline" title="Can't load cars" body="Check your connection and try again." action={{ label: 'Try again', onPress: () => cars.refetch() }} />
      ) : !cars.data ? (
        <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap', gap }]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} style={{ width: cardWidth, height: cardWidth * 0.75 + 70 }} />
          ))}
        </View>
      ) : cars.data.length === 0 ? (
        <MessageState icon="car-outline" title="No cars match" body="Try a different search or clear the filters." action={{ label: 'Clear filters', onPress: () => { setSearch(''); setCategory(undefined); setPlan(false); } }} />
      ) : (
        <FlatList
          key={columns}
          data={cars.data}
          numColumns={columns}
          keyExtractor={(c) => c.id}
          columnWrapperStyle={{ gap }}
          contentContainerStyle={[styles.grid, { gap: space.xl, paddingBottom: space.xxxl * 2 }]}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => <GridCard car={item} width={cardWidth} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: space.sm, backgroundColor: colors.surface, borderRadius: radius.card, paddingHorizontal: space.md, height: 44, marginTop: space.md },
  searchInput: { flex: 1, color: colors.text, fontSize: 17 },
  chipScroller: { flexGrow: 0, flexShrink: 0, height: 34 + space.md * 2 },
  chips: { paddingHorizontal: screenPadding, gap: space.sm, alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 34, borderRadius: radius.pill, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.gold },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: screenPadding, paddingBottom: space.md },
  grid: { paddingHorizontal: screenPadding },
});
