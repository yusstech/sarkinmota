import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageState, T } from '@/components/ui';
import { colors, screenPadding, space } from '@/theme/tokens';

// Placeholder until slice 2 (auth + saved) / slice 3 (orders).
export default function Orders() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <T variant="largeTitle" style={{ paddingHorizontal: screenPadding, marginTop: space.sm }}>
        Orders
      </T>
      <MessageState icon="cube-outline" title="No orders yet" body="Purchases, reservations and 40% plans will show here, with delivery tracking." />
    </View>
  );
}
