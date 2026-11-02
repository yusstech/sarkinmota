import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={colors.gold}
      iconColor={{ default: colors.textSecondary, selected: colors.gold }}
      labelStyle={{ default: { color: colors.textSecondary }, selected: { color: colors.gold } }}
      backgroundColor={colors.bg}
      indicatorColor="rgba(214,181,72,0.18)"
      labelVisibilityMode="labeled">
      <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.bg }}>
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="browse" contentStyle={{ backgroundColor: colors.bg }}>
        <NativeTabs.Trigger.Label>Browse</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="saved" contentStyle={{ backgroundColor: colors.bg }}>
        <NativeTabs.Trigger.Label>Saved</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="favorite" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="orders" contentStyle={{ backgroundColor: colors.bg }}>
        <NativeTabs.Trigger.Label>Orders</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} md="local_shipping" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="account" contentStyle={{ backgroundColor: colors.bg }}>
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
