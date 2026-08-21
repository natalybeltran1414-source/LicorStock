import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '../theme/colors';
import { Screen, Header, SearchBar, Badge, FAB, Card, ProgressBar } from '../components/ui';

const dummyInventory = [
  { id: '1', nombre: 'Whisky Chivas Regal 12 Años', stock: 2, min: 5 },
  { id: '2', nombre: 'Cerveza Corona Extra', stock: 45, min: 12 },
  { id: '3', nombre: 'Vino Tinto Casillero del Diablo', stock: 15, min: 6 },
  { id: '4', nombre: 'Ron Habana Club 7 Años', stock: 8, min: 6 },
];

export default function InventarioScreen() {
  const [query, setQuery] = useState('');
  const filtered = dummyInventory.filter(p =>
    p.nombre.toLowerCase().includes(query.toLowerCase())
  );
  const lowCount = dummyInventory.filter(p => p.stock <= p.min).length;

  return (
    <Screen>
      <Header
        title="Inventario"
        subtitle={`${dummyInventory.length} productos · ${lowCount} en alerta`}
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar en inventario..." />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const low = item.stock <= item.min;
          const ratio = item.stock / (item.min * 2);
          return (
            <Card style={styles.item}>
              <View style={styles.topRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
                  <View style={{ marginTop: 7 }}>
                    <Badge
                      label={low ? 'BAJO STOCK' : 'DISPONIBLE'}
                      tone={low ? 'danger' : 'success'}
                      icon={low ? 'warning' : 'checkmark-circle'}
                    />
                  </View>
                </View>
                <View style={styles.stockBox}>
                  <Text style={[styles.stockNum, { color: low ? colors.danger : colors.goldLight }]}>
                    {item.stock}
                  </Text>
                  <Text style={styles.stockLabel}>UNIDS</Text>
                </View>
              </View>

              <View style={styles.progressRow}>
                <ProgressBar ratio={ratio} tone={low ? 'danger' : 'success'} />
                <Text style={styles.minText}>mín. {item.min}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.entry]} activeOpacity={0.8}>
                  <Ionicons name="arrow-down" size={14} color="#1A1408" />
                  <Text style={styles.entryText}>Entrada</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.exit]} activeOpacity={0.8}>
                  <Ionicons name="arrow-up" size={14} color={colors.danger} />
                  <Text style={styles.exitText}>Salida</Text>
                </TouchableOpacity>
              </View>
            </Card>
          );
        }}
      />

      <FAB icon="swap-vertical" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingTop: 16,
    paddingBottom: 100,
  },
  item: {
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  name: {
    ...type.body,
    fontWeight: '700',
    color: colors.text,
  },
  stockBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  stockNum: {
    fontSize: 20,
    fontWeight: '800',
  },
  stockLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  minText: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
    flex: 1,
  },
  entry: {
    backgroundColor: colors.gold,
  },
  exit: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  entryText: {
    color: '#1A1408',
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 5,
  },
  exitText: {
    color: colors.danger,
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 5,
  },
});
