import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MessageState, T } from '@/components/ui';
import { colors, screenPadding, space } from '@/theme/tokens';

// Placeholder until slice 2 (auth + saved) / slice 3 (orders).
export default function Account() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <T variant="largeTitle" style={{ paddingHorizontal: screenPadding, marginTop: space.sm }}>
        Account
      </T>
      <MessageState icon="person-circle-outline" title="Your account" body="Sign in with your phone number to save cars and buy. Coming in the next build." />
    </View>
  );
}
