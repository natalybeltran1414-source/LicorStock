import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, Card, EmptyState } from '../components/ui';
import { movimientosService } from '../services/inventario';

const FILTROS = [
  { value: '', label: 'Todos', icon: 'apps-outline' },
  { value: 'ENTRADA', label: 'Entradas', icon: 'arrow-down-circle-outline' },
  { value: 'SALIDA', label: 'Salidas', icon: 'arrow-up-circle-outline' },
  { value: 'AJUSTE', label: 'Ajustes', icon: 'construct-outline' },
];

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const etiquetaFecha = iso => {
  const d = new Date(`${iso}T12:00:00`);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  const misma = a => a.getFullYear() === d.getFullYear()
    && a.getMonth() === d.getMonth() && a.getDate() === d.getDate();
  if (misma(hoy)) return `Hoy, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  if (misma(ayer)) return `Ayer, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
};

export default function MovimientosScreen() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [movimientos, setMovimientos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hayMas, setHayMas] = useState(false);

  const cargar = useCallback(async (tipo = filtro, pag = 1) => {
    pag === 1 ? setLoading(true) : setCargandoMas(true);
    try {
      const params = { page: pag };
      if (tipo) params.tipo = tipo;
      const { data } = await movimientosService.list(params);
      const filas = data.results || data;
      setMovimientos(prev => (pag === 1 ? filas : [...prev, ...filas]));
      setPagina(pag);
      setHayMas(!!data.next);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
      setCargandoMas(false);
    }
  }, [filtro]);

  useEffect(() => {
    cargar(filtro, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  useFocusEffect(
    useCallback(() => {
      cargar(filtro, 1);
    }, [filtro, cargar]),
  );

  const renderItem = ({ item, index }) => {
    const UI_TIPOS = {
      ENTRADA: { icon: 'arrow-down', color: c.success, bg: c.successSoft, signo: '+', etiqueta: 'ENTRADA' },
      SALIDA: { icon: 'arrow-up', color: c.danger, bg: c.dangerSoft, signo: '-', etiqueta: 'SALIDA' },
      AJUSTE: { icon: 'construct', color: c.info, bg: c.infoSoft, signo: '=', etiqueta: 'AJUSTE' },
    };
    const ui = UI_TIPOS[item.tipo_movimiento] || UI_TIPOS.AJUSTE;
    const fechaActual = item.fecha.slice(0, 10);
    const fechaAnterior = index > 0 ? movimientos[index - 1].fecha.slice(0, 10) : null;
    const mostrarSeparador = fechaActual !== fechaAnterior;
    const hora = new Date(item.fecha).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });

    return (
      <View>
        {mostrarSeparador && (
          <View style={styles.dateRow} accessible accessibilityLabel={etiquetaFecha(fechaActual)}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{etiquetaFecha(fechaActual)}</Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <Card style={styles.movCard}>
          <View style={[styles.movIcon, { backgroundColor: ui.bg }]}>
            <Ionicons name={ui.icon} size={16} color={ui.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.movNombre} numberOfLines={1}>{item.producto_nombre}</Text>
            <Text style={styles.movMotivo} numberOfLines={1}>
              {item.motivo || ui.etiqueta}
              {item.usuario_nombre ? ` · ${item.usuario_nombre}` : ''}
            </Text>
            <Text style={styles.movHora}>{hora}</Text>
          </View>
          <Text
            style={[styles.movCantidad, { color: ui.color }]}
            accessibilityLabel={`${ui.etiqueta} de ${item.cantidad}`}
          >
            {ui.signo}{item.cantidad}
          </Text>
        </Card>
      </View>
    );
  };

  return (
    <Screen>
      <Header title="Movimientos" subtitle="Entradas y salidas de inventario" />

      <View style={styles.filtros}>
        {FILTROS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filtroChip,
              filtro === f.value && { backgroundColor: c.goldSoft, borderColor: c.gold },
            ]}
            onPress={() => setFiltro(f.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filtrar por ${f.label}`}
          >
            <Ionicons
              name={f.icon}
              size={14}
              color={filtro === f.value ? c.goldLight : c.textSecondary}
            />
            <Text
              style={[
                styles.filtroText,
                filtro === f.value && { color: c.goldLight },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={movimientos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="swap-vertical-outline"
              title="Sin movimientos"
              subtitle="Las ventas y ajustes de inventario aparecerán aquí."
            />
          }
          renderItem={renderItem}
          onEndReached={() => {
            if (hayMas && !cargandoMas) cargar(filtro, pagina + 1);
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={cargandoMas ? <ActivityIndicator color={c.gold} style={{ marginVertical: 16 }} /> : null}
        />
      )}
    </Screen>
  );
}

const crearEstilos = c => StyleSheet.create({
  filtros: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: 8,
  },
  filtroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.surface,
  },
  filtroText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: spacing.lg,
    paddingTop: 4,
    paddingBottom: 40,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.borderSubtle,
  },
  dateText: {
    color: c.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginHorizontal: 10,
  },
  movCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 12,
  },
  movIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movNombre: {
    ...type.body,
    color: c.text,
    fontWeight: '700',
  },
  movMotivo: {
    color: c.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  movHora: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  movCantidad: {
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 10,
  },
});
