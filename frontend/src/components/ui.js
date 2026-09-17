import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';

export function Screen({ children, style }) {
  const { paleta: c } = useTema();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: c.background }, style]} edges={['top']}>
      {children}
    </SafeAreaView>
  );
}

export function Header({ title, subtitle, right, onBack }) {
  const { paleta: c } = useTema();
  return (
    <View style={headerStyles.header}>
      {onBack ? (
        <TouchableOpacity
          style={[headerStyles.backBtn, { backgroundColor: c.card, borderColor: c.border }]}
          onPress={onBack}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Volver atrás"
        >
          <Ionicons name="chevron-back" size={22} color={c.gold} />
        </TouchableOpacity>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[{ ...type.h1, color: c.text }]}>{title}</Text>
        {subtitle ? <Text style={[{ ...type.small, color: c.textSecondary, marginTop: 2 }]}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, glow }) {
  const { paleta: c } = useTema();
  return (
    <View
      style={[
        {
          backgroundColor: c.card,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          padding: spacing.md,
        },
        glow && c.shadow.gold,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function GoldButton({ label, icon, onPress, style, small, paleta }) {
  const { paleta: tema } = useTema();
  const c = paleta || tema;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[small && { alignSelf: 'flex-start' }, style]}>
      <LinearGradient
        colors={c.gradients.gold}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 15,
            borderRadius: radius.md,
            ...c.shadow.gold,
          },
          small && { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.sm },
        ]}
      >
        {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={c.sobreDorado} style={{ marginRight: 7 }} /> : null}
        <Text style={{ color: c.sobreDorado, fontWeight: '800', fontSize: small ? 13 : 15, letterSpacing: 0.3 }}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function GhostButton({ label, icon, onPress, style }) {
  const { paleta: c } = useTema();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.goldSoft,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={c.gold} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: c.goldLight, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress, dot }) {
  const { paleta: c } = useTema();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
          marginRight: spacing.sm,
        },
        active && { backgroundColor: c.goldSoft, borderColor: c.gold },
      ]}
    >
      {dot ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot, marginRight: 6 }} /> : null}
      <Text style={{ color: active ? c.goldLight : c.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const tonos = c => ({
  gold: { bg: c.goldSoft, fg: c.goldLight },
  success: { bg: c.successSoft, fg: c.success },
  warning: { bg: c.warningSoft, fg: c.warning },
  danger: { bg: c.dangerSoft, fg: c.danger },
  info: { bg: c.infoSoft, fg: c.info },
});

export function Badge({ label, tone = 'gold', icon }) {
  const { paleta: c } = useTema();
  const t = tonos(c)[tone] || tonos(c).gold;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: t.bg }}>
      {icon ? <Ionicons name={icon} size={11} color={t.fg} style={{ marginRight: 4 }} /> : null}
      <Text style={{ color: t.fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.4 }}>{label}</Text>
    </View>
  );
}

export function StatCard({ icon, label, value, tone = 'gold', sub }) {
  const { paleta: c } = useTema();
  const t = tonos(c)[tone] || tonos(c).gold;
  return (
    <Card style={{ flex: 1, padding: spacing.md }}>
      <View style={{ width: 34, height: 34, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: t.bg }}>
        <Ionicons name={icon} size={17} color={t.fg} />
      </View>
      <Text numberOfLines={1} style={{ ...type.micro, color: c.textSecondary, textTransform: 'uppercase', marginBottom: 6 }}>{label}</Text>
      <Text numberOfLines={1} style={{ fontSize: 21, fontWeight: '800', letterSpacing: -0.3, color: t.fg }}>{value}</Text>
      {sub ? <Text numberOfLines={1} style={{ ...type.small, color: c.textMuted, marginTop: 3 }}>{sub}</Text> : null}
    </Card>
  );
}

export function SearchBar({ value, onChangeText, placeholder }) {
  const { paleta: c } = useTema();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSubtle, borderRadius: radius.md, paddingHorizontal: 14, height: 46 }}>
      <Ionicons name="search" size={17} color={c.textMuted} />
      <TextInput
        style={{ flex: 1, color: c.text, fontSize: 15, marginLeft: 10 }}
        placeholder={placeholder || 'Buscar...'}
        placeholderTextColor={c.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

export function FAB({ icon, onPress }) {
  const { paleta: c } = useTema();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Agregar"
      style={{
        position: 'absolute',
        right: spacing.lg,
        bottom: spacing.xl,
        width: 58,
        height: 58,
        borderRadius: radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...c.shadow.gold,
      }}
    >
      <LinearGradient colors={c.gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Ionicons name={icon || 'add'} size={26} color={c.sobreDorado} />
    </TouchableOpacity>
  );
}

export function Avatar({ name, tone = 'gold' }) {
  const { paleta: c } = useTema();
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const t = tonos(c)[tone] || tonos(c).gold;
  return (
    <View style={{ width: 44, height: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <Text style={{ color: t.fg, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>{initials}</Text>
    </View>
  );
}

export function ProgressBar({ ratio, tone = 'gold' }) {
  const { paleta: c } = useTema();
  const t = tonos(c)[tone] || tonos(c).gold;
  return (
    <View style={{ height: 5, borderRadius: radius.pill, backgroundColor: c.surface, overflow: 'hidden', flex: 1 }}>
      <View style={{ height: '100%', borderRadius: radius.pill, width: `${Math.min(100, Math.max(6, ratio * 100))}%`, backgroundColor: t.fg }} />
    </View>
  );
}

export function EmptyState({ icon = 'file-tray-outline', title, subtitle }) {
  const { paleta: c } = useTema();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
      <View style={{ width: 56, height: 56, borderRadius: radius.lg, backgroundColor: c.card, borderWidth: 1, borderColor: c.borderSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Ionicons name={icon} size={26} color={c.textMuted} />
      </View>
      <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: 14 }}>{title || 'Nada por aquí'}</Text>
      {subtitle ? <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 4 }}>{subtitle}</Text> : null}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
});
