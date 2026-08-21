import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, type, spacing } from '../theme/colors';
import { Screen, Header, SearchBar, Chip, Badge, FAB, Card } from '../components/ui';

const CATEGORIES = ['Todos', 'Licores', 'Cervezas', 'Vinos', 'Otros'];

const dummyProducts = [
  { id: '1', nombre: 'Whisky Chivas Regal 12 Años', precio: 45.0, categoria: 'Licores', stock: 2 },
  { id: '2', nombre: 'Cerveza Corona Extra', precio: 2.5, categoria: 'Cervezas', stock: 45 },
  { id: '3', nombre: 'Vino Tinto Casillero del Diablo', precio: 12.0, categoria: 'Vinos', stock: 15 },
  { id: '4', nombre: 'Ron Habana Club 7 Años', precio: 18.5, categoria: 'Licores', stock: 8 },
];

const CAT_ICONS = {
  Licores: 'wine-outline',
  Cervezas: 'beer-outline',
  Vinos: 'flask-outline',
  Otros: 'cube-outline',
};

export default function ProductosScreen() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todos');

  const filtered = dummyProducts.filter(
    p =>
      (cat === 'Todos' || p.categoria === cat) &&
      p.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Screen>
      <Header
        title="Productos"
        subtitle={`${dummyProducts.length} registrados`}
      />
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar producto..." />
      </View>

      <View style={styles.chips}>
        {CATEGORIES.map(c => (
          <Chip key={c} label={c} active={cat === c} onPress={() => setCat(c)} />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Card style={styles.productCard}>
            <View style={styles.catIcon}>
              <Ionicons name={CAT_ICONS[item.categoria] || 'cube-outline'} size={20} color={colors.goldLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
              <View style={styles.metaRow}>
                <Badge label={item.categoria} tone="info" />
                <Text style={[styles.stockMini, { color: item.stock <= 5 ? colors.danger : colors.textMuted }]}>
                  Stock: {item.stock}
                </Text>
              </View>
            </View>
            <Text style={styles.price}>${item.precio.toFixed(2)}</Text>
          </Card>
        )}
      />

      <FAB icon="add" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 4,
    paddingBottom: 100,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  catIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  name: {
    ...type.body,
    color: colors.text,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 10,
  },
  stockMini: {
    fontSize: 12,
    fontWeight: '600',
  },
  price: {
    color: colors.goldLight,
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 10,
  },
});
