import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '../theme/colors';
import { Screen, Header, Card, Badge, ProgressBar } from '../components/ui';

const lowStock = [
  { id: '1', nombre: 'Whisky Chivas Regal 12A', stock: 2, min: 5 },
  { id: '2', nombre: 'Cerveza Corona Extra', stock: 4, min: 12 },
  { id: '3', nombre: 'Ron Habana Club 7A', stock: 3, min: 6 },
];

export default function DashboardScreen({ navigation }) {
  return (
    <Screen>
      <Header
        title="Buenas tardes"
        subtitle="Miércoles 20 Ago"
        right={
          <TouchableOpacity style={styles.bell}>
            <Ionicons name="notifications-outline" size={22} color={colors.gold} />
            <View style={styles.dot} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero único */}
        <Card glow style={styles.hero}>
          <Text style={styles.heroLabel}>VENTAS DE HOY</Text>
          <Text style={styles.heroValue}>$ 450.00</Text>
        </Card>

        {/* KPIs accionables */}
        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={[styles.kpi, styles.kpiDanger]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Clientes')}
          >
            <View style={styles.kpiHead}>
              <Ionicons name="wallet-outline" size={16} color={colors.danger} />
              <Text style={styles.kpiLabel}>POR COBRAR</Text>
            </View>
            <Text style={[styles.kpiValue, { color: colors.danger }]}>$ 120.00</Text>
            <View style={styles.kpiFoot}>
              <Text style={styles.kpiSub}>3 clientes</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpi, styles.kpiGold]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Inventario')}
          >
            <View style={styles.kpiHead}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.goldLight} />
              <Text style={styles.kpiLabel}>BAJO STOCK</Text>
            </View>
            <Text style={[styles.kpiValue, { color: colors.goldLight }]}>6</Text>
            <View style={styles.kpiFoot}>
              <Text style={styles.kpiSub}>productos</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Requiere atención */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>REQUIERE ATENCIÓN</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inventario')}>
            <Text style={styles.link}>Ver inventario</Text>
          </TouchableOpacity>
        </View>

        <Card style={{ paddingVertical: 4 }}>
          {lowStock.map((p, i) => (
            <View key={p.id} style={[styles.stockItem, i < lowStock.length - 1 && styles.divider]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.stockName} numberOfLines={1}>{p.nombre}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <ProgressBar ratio={p.stock / p.min} tone="danger" />
                  <Text style={styles.stockNum}>{p.stock}/{p.min}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.restock} activeOpacity={0.8}>
                <Ionicons name="add" size={16} color="#1A1408" />
                <Text style={styles.restockText}>Surtir</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 26,
    marginBottom: spacing.md,
  },
  heroLabel: {
    ...type.micro,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.goldLight,
    letterSpacing: -1,
    marginTop: 8,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  kpi: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  kpiDanger: {
    borderColor: 'rgba(255,107,107,0.25)',
  },
  kpiGold: {
    borderColor: colors.border,
  },
  kpiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  kpiLabel: {
    ...type.micro,
    color: colors.textSecondary,
    letterSpacing: 1.5,
    fontSize: 10,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  kpiFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  kpiSub: {
    ...type.small,
    color: colors.textMuted,
    fontSize: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...type.micro,
    color: colors.textSecondary,
    letterSpacing: 1.6,
  },
  link: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stockName: {
    ...type.body,
    color: colors.text,
  },
  stockNum: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    width: 44,
    textAlign: 'right',
  },
  restock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginLeft: 12,
  },
  restockText: {
    color: '#1A1408',
    fontWeight: '800',
    fontSize: 12,
  },
});
