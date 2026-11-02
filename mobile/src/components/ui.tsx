import Ionicons from '@expo/vector-icons/Ionicons';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { colors, radius, space, type } from '@/theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

const liquidGlass = Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

/** Liquid Glass on iOS 26+, translucent dark fill elsewhere. */
export function Glass({ style, children, interactive }: { style?: StyleProp<ViewStyle>; children?: ReactNode; interactive?: boolean }) {
  if (liquidGlass) {
    return (
      <GlassView style={style} glassEffectStyle="regular" colorScheme="dark" isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }
  return <View style={[{ backgroundColor: colors.glassFallback }, style]}>{children}</View>;
}

/** Scale-on-press wrapper, the base for every tappable surface. */
export function Tap({
  onPress,
  style,
  children,
  haptic = false,
  disabled,
  accessibilityLabel,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  haptic?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={() => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: disabled ? 0.5 : 1 }]}>
      {children}
    </Pressable>
  );
}

type PillVariant = 'primary' | 'gold' | 'glass';

export function PillButton({
  label,
  icon,
  variant = 'primary',
  onPress,
  style,
  loading,
  compact,
}: {
  label: string;
  icon?: IconName;
  variant?: PillVariant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
  compact?: boolean;
}) {
  const fg = variant === 'glass' ? colors.text : '#000';
  const inner = (
    <View style={[styles.pillInner, compact && styles.pillCompact]}>
      {loading ? <ActivityIndicator color={fg} /> : icon ? <Ionicons name={icon} size={compact ? 15 : 17} color={fg} /> : null}
      <Text style={[styles.pillLabel, compact && { fontSize: 15 }, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
  return (
    <Tap onPress={onPress} haptic style={style} accessibilityLabel={label}>
      {variant === 'glass' ? (
        <Glass style={styles.pill} interactive>
          {inner}
        </Glass>
      ) : (
        <View style={[styles.pill, { backgroundColor: variant === 'gold' ? colors.gold : colors.text }]}>{inner}</View>
      )}
    </Tap>
  );
}

export function GlassCircle({ icon, onPress, size = 40, label, color = colors.text }: { icon: IconName; onPress?: () => void; size?: number; label: string; color?: string }) {
  return (
    <Tap onPress={onPress} haptic accessibilityLabel={label}>
      <Glass style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }} interactive>
        <Ionicons name={icon} size={size * 0.48} color={color} />
      </Glass>
    </Tap>
  );
}

export function SectionHeader({ title, onPress, style }: { title: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const content = (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} style={{ marginTop: 2 }} /> : null}
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} style={style} accessibilityLabel={title}>
      {content}
    </Tap>
  ) : (
    <View style={style}>{content}</View>
  );
}

export function T({ style, children, variant = 'body', color = colors.text, lines }: { style?: StyleProp<TextStyle>; children: ReactNode; variant?: keyof typeof type; color?: string; lines?: number }) {
  return (
    <Text style={[type[variant] as TextStyle, { color }, style]} numberOfLines={lines}>
      {children}
    </Text>
  );
}

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ backgroundColor: colors.surface, borderRadius: radius.card }, style]} />;
}

export function MessageState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.message}>
      <Ionicons name={icon} size={44} color={colors.gold} />
      <T variant="title3" style={{ textAlign: 'center', marginTop: space.lg }}>
        {title}
      </T>
      {body ? (
        <T variant="subhead" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: space.sm }}>
          {body}
        </T>
      ) : null}
      {action ? <PillButton label={action.label} onPress={action.onPress} style={{ marginTop: space.xl }} compact /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { borderRadius: radius.pill, overflow: 'hidden' },
  pillInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 22, height: 50 },
  pillCompact: { height: 40, paddingHorizontal: 18 },
  pillLabel: { fontSize: 17, fontWeight: '600' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionTitle: { ...(type.title3 as TextStyle), color: colors.text },
  message: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xxxl },
});
