import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '../theme/colors';
import { Screen, Header, SearchBar, Badge, FAB, Card, Avatar } from '../components/ui';

const dummyClients = [
  { id: '1', nombre: 'Juan Pérez', telefono: '0987654321', deuda: 12.0 },
  { id: '2', nombre: 'María González', telefono: '0998877665', deuda: 0 },
  { id: '3', nombre: 'Carlos Ruiz', telefono: '0961234567', deuda: 45.5 },
];

export default function ClientesScreen() {
  const [query, setQuery] = useState('');
  const filtered = dummyClients.filter(
    c =>
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.telefono.includes(query)
  );
  const totalDeuda = dummyClients.reduce((a, c) => a + c.deuda, 0);

  return (
    <Screen>
      <Header
        title="Clientes"
        subtitle={`${dummyClients.length} registrados`}
        right={
          <View style={styles.debtPill}>
            <Text style={styles.debtPillLabel}>POR COBRAR</Text>
            <Text style={styles.debtPillValue}>${totalDeuda.toFixed(2)}</Text>
          </View>
        }
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar cliente..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const conDeuda = item.deuda > 0;
          return (
            <Card style={styles.clientCard}>
              <Avatar name={item.nombre} tone={conDeuda ? 'danger' : 'success'} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
                <View style={styles.phoneRow}>
                  <Ionicons name="call-outline" size={12} color={colors.textMuted} />
                  <Text style={styles.phone}>{item.telefono}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.debtLabel}>SALDO</Text>
                <Text
                  style={[styles.debtValue, { color: conDeuda ? colors.danger : colors.success }]}
                >
                  ${item.deuda.toFixed(2)}
                </Text>
              </View>
              {conDeuda && (
                <TouchableOpacity style={styles.payBtn} activeOpacity={0.8}>
                  <Text style={styles.payBtnText}>Abonar</Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        }}
      />

      <FAB icon="person-add" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  debtPill: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  debtPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  debtPillValue: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 1,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 16,
    paddingBottom: 100,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  name: {
    ...type.body,
    fontWeight: '700',
    color: colors.text,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phone: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 5,
  },
  debtLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  debtValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  payBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 12,
  },
  payBtnText: {
    color: '#1A1408',
    fontWeight: '800',
    fontSize: 12,
  },
});
