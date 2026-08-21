import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, type, shadow, spacing } from '../theme/colors';

export function Screen({ children, style }) {
  return (
    <SafeAreaView style={[styles.screen, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, glow }) {
  return (
    <View style={[styles.card, glow && shadow.gold, style]}>
      {children}
    </View>
  );
}

export function GoldButton({ label, icon, onPress, style, small }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[small && { alignSelf: 'flex-start' }, style]}>
      <LinearGradient
        colors={gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.goldBtn, small && styles.goldBtnSmall]}
      >
        {icon ? <Ionicons name={icon} size={small ? 15 : 18} color="#1A1408" style={{ marginRight: 7 }} /> : null}
        <Text style={[styles.goldBtnText, small && { fontSize: 13 }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({ label, icon, onPress, style }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[styles.ghostBtn, style]}>
      {icon ? <Ionicons name={icon} size={16} color={colors.gold} style={{ marginRight: 6 }} /> : null}
      <Text style={styles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const BADGE_TONES = {
  gold: { bg: colors.goldSoft, fg: colors.goldLight },
  success: { bg: colors.successSoft, fg: colors.success },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  info: { bg: colors.infoSoft, fg: colors.info },
};

export function Badge({ label, tone = 'gold', icon }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.gold;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      {icon ? <Ionicons name={icon} size={11} color={t.fg} style={{ marginRight: 4 }} /> : null}
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function StatCard({ icon, label, value, tone = 'gold', sub }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.gold;
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={17} color={t.fg} />
      </View>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
      <Text style={[styles.statValue, { color: t.fg }]} numberOfLines={1}>{value}</Text>
      {sub ? <Text style={styles.statSub} numberOfLines={1}>{sub}</Text> : null}
    </Card>
  );
}

export function SearchBar({ value, onChangeText, placeholder }) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={17} color={colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder || 'Buscar...'}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function FAB({ icon, onPress }) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.fab} onPress={onPress}>
      <LinearGradient
        colors={gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Ionicons name={icon || 'add'} size={26} color="#1A1408" />
    </TouchableOpacity>
  );
}

export function Avatar({ name, tone = 'gold' }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const t = BADGE_TONES[tone] || BADGE_TONES.gold;
  return (
    <View style={[styles.avatar, { backgroundColor: t.bg }]}>
      <Text style={[styles.avatarText, { color: t.fg }]}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ ratio, tone = 'gold' }) {
  const t = BADGE_TONES[tone] || BADGE_TONES.gold;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(6, ratio * 100))}%`, backgroundColor: t.fg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    ...type.h1,
    color: colors.text,
  },
  headerSubtitle: {
    ...type.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
  },
  goldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: radius.md,
    ...shadow.gold,
  },
  goldBtnSmall: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
  goldBtnText: {
    color: '#1A1408',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.goldSoft,
  },
  ghostBtnText: {
    color: colors.goldLight,
    fontWeight: '700',
    fontSize: 14,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.goldSoft,
    borderColor: colors.gold,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.goldLight,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statLabel: {
    ...type.micro,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  statSub: {
    ...type.small,
    color: colors.textMuted,
    marginTop: 3,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    marginLeft: 10,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...shadow.gold,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  progressTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    flex: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
