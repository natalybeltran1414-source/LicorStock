import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '../theme/colors';
import { Screen, Header, Card, Badge, FAB, Avatar } from '../components/ui';

const dummySales = [
  { id: '1', cliente: 'Consumidor Final', fecha: 'Hoy · 14:32', total: 45.0, estado: 'PAGADA', items: 3 },
  { id: '2', cliente: 'Juan Pérez', fecha: 'Hoy · 12:05', total: 12.0, estado: 'CREDITO', items: 2 },
  { id: '3', cliente: 'María González', fecha: 'Ayer · 18:47', total: 78.5, estado: 'PAGADA', items: 5 },
  { id: '4', cliente: 'Carlos Ruiz', fecha: 'Ayer · 10:15', total: 23.0, estado: 'ANULADA', items: 1 },
];

const FILTERS = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'PAGADA', label: 'Pagadas' },
  { key: 'CREDITO', label: 'Crédito' },
];

export default function VentasScreen() {
  const [filter, setFilter] = useState('TODAS');
  const filtered = dummySales.filter(s => filter === 'TODAS' || s.estado === filter);
  const totalDia = dummySales
    .filter(s => s.estado !== 'ANULADA')
    .reduce((a, s) => a + s.total, 0);

  return (
    <Screen>
      <Header title="Ventas" subtitle="Historial de operaciones" />

      {/* Resumen del día */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <Card glow style={styles.summary}>
          <View>
            <Text style={styles.sumLabel}>TOTAL REGISTRADO</Text>
            <Text style={styles.sumValue}>${totalDia.toFixed(2)}</Text>
          </View>
          <View style={styles.sumIcon}>
            <Ionicons name="trending-up" size={24} color="#1A1408" />
          </View>
        </Card>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            activeOpacity={0.8}
            onPress={() => setFilter(f.key)}
            style={[styles.filterBtn, filter === f.key && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const tone =
            item.estado === 'PAGADA' ? 'success' : item.estado === 'CREDITO' ? 'gold' : 'danger';
          return (
            <Card style={styles.saleCard}>
              <Avatar name={item.cliente} tone={tone} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.client} numberOfLines={1}>{item.cliente}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.date}>{item.fecha}</Text>
                  <Text style={styles.dotSep}>·</Text>
                  <Text style={styles.date}>{item.items} ítems</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.total}>${item.total.toFixed(2)}</Text>
                <View style={{ marginTop: 5 }}>
                  <Badge label={item.estado} tone={tone} />
                </View>
              </View>
            </Card>
          );
        }}
      />

      <FAB icon="add" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  sumLabel: {
    ...type.micro,
    color: colors.textSecondary,
    letterSpacing: 2,
  },
  sumValue: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.goldLight,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  sumIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  filterActive: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
  filterText: {
    color: colors.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  filterTextActive: {
    color: colors.goldLight,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 2,
    paddingBottom: 100,
  },
  saleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  client: {
    ...type.body,
    fontWeight: '700',
    color: colors.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 4,
  },
  dotSep: {
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  total: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
});
