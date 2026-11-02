import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageState, T } from '@/components/ui';
import { colors, screenPadding, space } from '@/theme/tokens';

// Placeholder until slice 2 (auth + saved) / slice 3 (orders).
export default function Saved() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <T variant="largeTitle" style={{ paddingHorizontal: screenPadding, marginTop: space.sm }}>
        Saved
      </T>
      <MessageState icon="heart-outline" title="Your shortlist" body="Save cars you're considering and compare them here. Sign-in arrives in the next build." />
    </View>
  );
}
