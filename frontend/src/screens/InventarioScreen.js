import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, SearchBar, Badge, FAB, Card, ProgressBar } from '../components/ui';
import { productosService, movimientosService } from '../services/inventario';

const TIPOS = {
  ENTRADA: { icon: 'arrow-down', tone: 'success', label: 'Entrada' },
  SALIDA: { icon: 'arrow-up', tone: 'danger', label: 'Salida' },
  AJUSTE: { icon: 'construct', tone: 'gold', label: 'Ajuste' },
};

export default function InventarioScreen() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [productos, setProductos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // modal de movimiento
  const [movVisible, setMovVisible] = useState(false);
  const [productoSel, setProductoSel] = useState(null);
  const [tipoMov, setTipoMov] = useState('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [movError, setMovError] = useState('');
  const [saving, setSaving] = useState(false);

  // historial
  const [histVisible, setHistVisible] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const params = query.trim() ? { search: query.trim() } : {};
      const [{ data }, { data: res }] = await Promise.all([
        productosService.list(params),
        productosService.resumen(),
      ]);
      setProductos(data.results || data);
      setResumen(res);
    } catch {
      // silencioso; la lista queda vacía
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(cargar, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirMovimiento = (p, tipo) => {
    setProductoSel(p);
    setTipoMov(tipo);
    setCantidad('');
    setMotivo('');
    setMovError('');
    setMovVisible(true);
  };

  const guardarMovimiento = async () => {
    const cant = parseInt(cantidad, 10);
    if (!Number.isInteger(cant) || cant < 0 || (tipoMov !== 'AJUSTE' && cant === 0)) {
      setMovError('Ingresa una cantidad válida.');
      return;
    }
    try {
      setSaving(true);
      setMovError('');
      await movimientosService.ajustar({
        producto: productoSel.id,
        tipo_movimiento: tipoMov,
        cantidad: cant,
        motivo: motivo.trim() || undefined,
      });
      setMovVisible(false);
      cargar();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' && d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : 'No se pudo registrar el movimiento';
      setMovError(msg);
    } finally {
      setSaving(false);
    }
  };

  const verHistorial = async (p) => {
    setHistVisible(true);
    setHistLoading(true);
    try {
      const { data } = await movimientosService.list({ producto: p.id });
      setHistorial(data.results || data);
    } catch {
      setHistorial([]);
    } finally {
      setHistLoading(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Inventario"
        subtitle={resumen ? `${resumen.total_productos} productos · ${resumen.unidades_totales} unidades` : ''}
        right={
          resumen && resumen.bajo_stock > 0 ? (
              <View style={styles.alertPill}>
                <Ionicons name="warning" size={13} color={c.warning} />
                <Text style={styles.alertPillText}>{resumen.bajo_stock} bajos</Text>
              </View>
          ) : null
        }
      />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar en inventario..." />
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Sin productos en inventario.</Text>}
          renderItem={({ item }) => {
            const critico = (item.stock_actual ?? 0) === 0;
            const low = !critico && item.stock_actual <= item.stock_minimo;
            const ratio = item.stock_actual / Math.max(1, item.stock_minimo * 2);
            return (
              <Card style={styles.item}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => verHistorial(item)}>
                  <View style={styles.topRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
                      <View style={{ marginTop: 7 }}>
                        <Badge
                          label={critico ? 'SIN STOCK' : low ? 'BAJO STOCK' : 'DISPONIBLE'}
                          tone={critico ? 'danger' : low ? 'warning' : 'success'}
                          icon={critico ? 'alert-circle' : low ? 'warning' : 'checkmark-circle'}
                        />
                      </View>
                    </View>
                    <View style={styles.stockBox}>
                      <Text style={[styles.stockNum, { color: critico ? c.danger : low ? c.warning : c.goldLight }]}>
                        {item.stock_actual ?? 0}
                      </Text>
                      <Text style={styles.stockLabel}>UNIDS</Text>
                    </View>
                  </View>

                  <View style={styles.progressRow}>
                    <ProgressBar ratio={ratio} tone={critico ? 'danger' : low ? 'warning' : 'success'} />
                    <Text style={styles.minText}>mín. {item.stock_minimo}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.entry]}
                    activeOpacity={0.8}
                    onPress={() => abrirMovimiento(item, 'ENTRADA')}
                  >
                    <Ionicons name="arrow-down" size={14} color={c.sobreDorado} />
                    <Text style={styles.entryText}>Entrada</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.exit]}
                    activeOpacity={0.8}
                    onPress={() => abrirMovimiento(item, 'SALIDA')}
                  >
                    <Ionicons name="arrow-up" size={14} color={c.danger} />
                    <Text style={styles.exitText}>Salida</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.adjust]}
                    activeOpacity={0.8}
                    onPress={() => abrirMovimiento(item, 'AJUSTE')}
                  >
                    <Ionicons name="construct" size={14} color={c.goldLight} />
                    <Text style={styles.adjustText}>Ajustar</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      )}

      {/* Modal de movimiento */}
      <Modal visible={movVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{TIPOS[tipoMov].label} de inventario</Text>
            <Text style={styles.modalSub}>{productoSel?.nombre}</Text>
            <View style={styles.currentStock}>
              <Text style={styles.currentStockLabel}>STOCK ACTUAL</Text>
              <Text style={styles.currentStockValue}>{productoSel?.stock_actual ?? 0}</Text>
            </View>

            {tipoMov === 'AJUSTE' && (
              <Text style={styles.adjustHint}>El stock quedará exactamente en la cantidad indicada.</Text>
            )}

            <Text style={styles.label}>CANTIDAD</Text>
            <TextInput
              style={styles.input}
              value={cantidad}
              onChangeText={setCantidad}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={c.textMuted}
            />

            <Text style={styles.label}>MOTIVO (OPCIONAL)</Text>
            <TextInput
              style={[styles.input, { height: 56 }]}
              value={motivo}
              onChangeText={setMotivo}
              multiline
              placeholder="Ej. compra a proveedor, producto dañado..."
              placeholderTextColor={c.textMuted}
            />

            {movError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{movError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setMovVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.6 }]} onPress={guardarMovimiento} disabled={saving}>
                {saving
                  ? <ActivityIndicator size="small" color={c.sobreDorado} />
                  : <Text style={styles.confirmText}>Registrar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal historial */}
      <Modal visible={histVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, styles.historyCard]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Movimientos</Text>
              <TouchableOpacity onPress={() => setHistVisible(false)}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            {histLoading ? (
              <ActivityIndicator color={c.gold} style={{ marginTop: 30 }} />
            ) : (
              <FlatList
                data={historial}
                keyExtractor={item => String(item.id)}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={<Text style={styles.empty}>Sin movimientos registrados.</Text>}
                renderItem={({ item }) => {
                  const t = TIPOS[item.tipo_movimiento];
                  return (
                    <View style={styles.histRow}>
                      <View style={[styles.histIcon, { backgroundColor: c[`${t.tone}Soft`] || c.goldSoft }]}>
                        <Ionicons name={t.icon} size={15} color={t.tone === 'gold' ? c.goldLight : c[t.tone]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.histTitle}>{t.label} · {item.cantidad}</Text>
                        <Text style={styles.histSub} numberOfLines={1}>{item.motivo || 'Sin motivo'}</Text>
                      </View>
                      <Text style={styles.histDate}>
                        {new Date(item.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const crearEstilos = c => StyleSheet.create({
  list: {
    padding: spacing.lg,
    paddingTop: 16,
    paddingBottom: 100,
  },
  empty: {
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 30,
  },
  alertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: c.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  alertPillText: {
    color: c.danger,
    fontWeight: '700',
    fontSize: 12,
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
    color: c.text,
  },
  stockBox: {
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
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
    color: c.textMuted,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  minText: {
    color: c.textMuted,
    fontSize: 11,
    marginLeft: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
    flex: 1,
    gap: 4,
  },
  entry: {
    backgroundColor: c.gold,
  },
  exit: {
    backgroundColor: c.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
  },
  adjust: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  entryText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 12,
  },
  exitText: {
    color: c.danger,
    fontWeight: '800',
    fontSize: 12,
  },
  adjustText: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 12,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,12,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: c.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
  historyCard: {
    maxHeight: '70%',
    justifyContent: 'flex-start',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  modalTitle: {
    ...type.h2,
    color: c.text,
  },
  modalSub: {
    ...type.small,
    color: c.textSecondary,
    marginTop: 2,
  },
  currentStock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
  },
  currentStockLabel: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.5,
  },
  currentStockValue: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 20,
  },
  adjustHint: {
    color: c.info,
    fontSize: 12,
    marginTop: 10,
  },
  label: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.sm,
    color: c.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.3)',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  errorText: {
    color: c.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.borderSubtle,
  },
  cancelText: {
    color: c.textSecondary,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: c.gold,
  },
  confirmText: {
    color: c.sobreDorado,
    fontWeight: '800',
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  histIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  histTitle: {
    color: c.text,
    fontWeight: '700',
    fontSize: 14,
  },
  histSub: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  histDate: {
    color: c.textMuted,
    fontSize: 11,
    marginLeft: 8,
  },
});
