import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, SearchBar, Badge, Card, EmptyState } from '../components/ui';
import { deudasService } from '../services/ventas';

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'cash-outline' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'card-outline' },
  { value: 'TRANSFERENCIA', label: 'Transfer.', icon: 'swap-horizontal-outline' },
];

const FILTROS = [
  { value: 'PENDIENTE', label: 'Pendientes' },
  { value: 'PAGADA', label: 'Pagadas' },
  { value: '', label: 'Todas' },
];

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

const normalizarTelefono = tel => {
  let t = String(tel || '').replace(/\D/g, '');
  if (!t) return null;
  if (t.startsWith('593')) return t;
  if (t.startsWith('0')) return '593' + t.slice(1);
  if (t.length === 9) return '593' + t;
  return t;
};

export default function CuentasScreen({ navigation }) {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [deudas, setDeudas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [filtro, setFiltro] = useState('PENDIENTE');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // modal detalle + abono
  const [detalle, setDetalle] = useState(null);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState('EFECTIVO');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtro) params.estado = filtro;
      if (query.trim()) params.search = query.trim();
      const [{ data }, { data: res }] = await Promise.all([
        deudasService.list(params),
        deudasService.resumen(),
      ]);
      setDeudas(data.results || data);
      setResumen(res);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [filtro, query]);

  useEffect(() => {
    const t = setTimeout(cargar, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirDetalle = (d) => {
    setDetalle(d);
    setMonto('');
    setMetodo('EFECTIVO');
    setError('');
  };

  const abonar = async () => {
    const valor = parseFloat(monto);
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    if (valor - Number(detalle.saldo_pendiente) > 0.009) {
      setError(`El abono excede el saldo (${fmt(detalle.saldo_pendiente)}).`);
      return;
    }
    try {
      setSaving(true);
      setError('');
      await deudasService.abonar(detalle.id, { monto: valor, metodo });
      setDetalle(null);
      cargar();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' && d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : err.response?.data?.detail || 'No se pudo registrar el abono';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Header
        title="Cuentas por cobrar"
        onBack={() => navigation.goBack()}
        subtitle={resumen
          ? `${resumen.deudas_pendientes} pendientes · ${fmt(resumen.total_por_cobrar)}`
          : ''}
        right={
          resumen && resumen.total_por_cobrar > 0 ? (
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>POR COBRAR</Text>
              <Text style={styles.pillValue}>{fmt(resumen.total_por_cobrar)}</Text>
            </View>
          ) : null
        }
      />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar cliente o factura..." />
        <View style={styles.filtros}>
          {FILTROS.map(f => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filtroChip, filtro === f.value && styles.filtroActive]}
              onPress={() => setFiltro(f.value)}
            >
              <Text style={[styles.filtroText, filtro === f.value && styles.filtroTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={deudas}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="wallet-outline" title="Sin cuentas por cobrar" subtitle="Las ventas a crédito generan deudas aquí." />
          }
          renderItem={({ item }) => {
            const pagada = item.estado !== 'PENDIENTE';
            const recordarWhatsApp = (deuda) => {
              const tel = normalizarTelefono(deuda.cliente_telefono);
              if (!tel) {
                Alert.alert('Sin teléfono', 'El cliente no tiene un número de WhatsApp registrado.');
                return;
              }
              const msg =
                `Hola ${deuda.cliente_nombre}, le recordamos amablemente su saldo pendiente de ` +
                `${fmt(deuda.saldo_pendiente)} (factura ${deuda.venta_numero}) con LicorStock. ¡Gracias!`;
              Linking.openURL(`https://wa.me/${tel}?text=${encodeURIComponent(msg)}`).catch(() => {
                Alert.alert('Error', 'No se pudo abrir WhatsApp.');
              });
            };

            return (
              <Card style={styles.card}>
                <TouchableOpacity style={styles.main} activeOpacity={0.8} onPress={() => abrirDetalle(item)}>
                  <View style={[styles.icon, { backgroundColor: pagada ? c.successSoft : c.dangerSoft }]}>
                    <Ionicons name={pagada ? 'checkmark' : 'time'} size={16} color={pagada ? c.success : c.danger} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nombre} numberOfLines={1}>{item.cliente_nombre}</Text>
                    <Text style={styles.sub}>
                      {item.venta_numero} · {new Date(item.fecha_inicio).toLocaleDateString('es-EC')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.saldo, { color: pagada ? c.success : c.danger }]}>
                      {fmt(item.saldo_pendiente)}
                    </Text>
                    <Badge
                      label={item.estado}
                      tone={item.estado === 'PENDIENTE' ? 'danger' : item.estado === 'PAGADA' ? 'success' : 'info'}
                    />
                  </View>
                </TouchableOpacity>
                {!pagada && (
                  <View style={styles.accionesRow}>
                    <TouchableOpacity style={[styles.abonarBtn, { flex: 1 }]} activeOpacity={0.8} onPress={() => abrirDetalle(item)}>
                      <Ionicons name="cash" size={14} color={c.sobreDorado} />
                      <Text style={styles.abonarText}>Abonar</Text>
                    </TouchableOpacity>
                    {item.cliente_telefono && (
                      <TouchableOpacity
                        style={styles.waBtn}
                        activeOpacity={0.8}
                        onPress={() => recordarWhatsApp(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Enviar recordatorio de pago por WhatsApp a ${item.cliente_nombre}`}
                      >
                        <Ionicons name="logo-whatsapp" size={17} color="#25D366" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Card>
            );
          }}
        />
      )}

      {/* Modal detalle / abonar */}
      <Modal visible={!!detalle} animationType="slide" transparent>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{detalle?.cliente_nombre}</Text>
                  <Text style={styles.modalSub}>Venta {detalle?.venta_numero}</Text>
                </View>
                <TouchableOpacity onPress={() => setDetalle(null)}>
                  <Ionicons name="close" size={22} color={c.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.saldoBox}>
                <View>
                  <Text style={styles.saldoLabel}>SALDO PENDIENTE</Text>
                  <Text style={[styles.saldoValue, { color: detalle?.estado === 'PENDIENTE' ? c.danger : c.success }]}>
                    {fmt(detalle?.saldo_pendiente)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.saldoLabel}>ORIGINAL</Text>
                  <Text style={styles.saldoOriginal}>{fmt(detalle?.monto_original)}</Text>
                </View>
              </View>

              {detalle?.estado === 'PENDIENTE' ? (
                <>
                  <Text style={styles.label}>MONTO DEL ABONO</Text>
                  <TextInput
                    style={styles.input}
                    value={monto}
                    onChangeText={v => setMonto(v.replace(/[^0-9.]/g, ''))}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor={c.textMuted}
                  />

                  <Text style={styles.label}>MÉTODO DE PAGO</Text>
                  <View style={styles.metodosRow}>
                    {METODOS.map(m => (
                      <TouchableOpacity
                        key={m.value}
                        style={[styles.metodoChip, metodo === m.value && styles.metodoChipActive]}
                        onPress={() => setMetodo(m.value)}
                      >
                        <Ionicons name={m.icon} size={13} color={metodo === m.value ? c.sobreDorado : c.textSecondary} />
                        <Text style={[styles.metodoText, metodo === m.value && styles.metodoTextActive]}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {!!error && (
                    <View style={styles.errorBox}>
                      <Ionicons name="alert-circle" size={15} color={c.danger} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity style={[styles.confirmBtn, saving && { opacity: 0.6 }]} onPress={abonar} disabled={saving}>
                    {saving
                      ? <ActivityIndicator size="small" color={c.sobreDorado} />
                      : (
                        <>
                          <Ionicons name="cash" size={17} color={c.sobreDorado} />
                          <Text style={styles.confirmText}>Registrar abono</Text>
                        </>
                      )}
                  </TouchableOpacity>
                </>
              ) : null}

              <Text style={styles.label}>HISTORIAL DE ABONOS</Text>
              {(detalle?.abonos || []).length === 0 ? (
                <Text style={styles.sinAbonos}>Sin abonos registrados.</Text>
              ) : (
                detalle.abonos.map(a => (
                  <View key={String(a.id)} style={styles.abonoRow}>
                    <Ionicons
                      name={METODOS.find(m => m.value === a.metodo)?.icon || 'cash-outline'}
                      size={13}
                      color={c.goldLight}
                    />
                    <Text style={styles.abonoMetodo}>{a.metodo}</Text>
                    <Text style={styles.abonoFecha}>
                      {new Date(a.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })}
                    </Text>
                    <Text style={styles.abonoMonto}>{fmt(a.monto)}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

const crearEstilos = c => StyleSheet.create({
  pill: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  pillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: c.textMuted,
  },
  pillValue: {
    color: c.danger,
    fontWeight: '800',
    fontSize: 15,
    marginTop: 1,
  },
  filtros: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  filtroChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.surface,
  },
  filtroActive: {
    backgroundColor: c.goldSoft,
    borderColor: c.gold,
  },
  filtroText: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filtroTextActive: {
    color: c.goldLight,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 14,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 12,
  },
  main: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nombre: {
    ...type.body,
    fontWeight: '700',
    color: c.text,
  },
  sub: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  saldo: {
    fontSize: 15,
    fontWeight: '800',
  },
  abonarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: c.gold,
    borderRadius: radius.sm,
    paddingVertical: 9,
    marginTop: 12,
  },
  abonarText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 13,
  },
  accionesRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  waBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,12,0.75)',
  },
  scrollCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  saldoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 6,
  },
  saldoLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: c.textMuted,
  },
  saldoValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 3,
  },
  saldoOriginal: {
    color: c.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },
  label: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 16,
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
  metodosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metodoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.card,
  },
  metodoChipActive: {
    backgroundColor: c.gold,
    borderColor: c.gold,
  },
  metodoText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
  },
  metodoTextActive: {
    color: c.sobreDorado,
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
    marginTop: 14,
  },
  errorText: {
    color: c.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: c.gold,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginTop: 16,
  },
  confirmText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 15,
  },
  sinAbonos: {
    color: c.textMuted,
    fontSize: 13,
  },
  abonoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
    gap: 7,
  },
  abonoMetodo: {
    flex: 1,
    color: c.text,
    fontSize: 13,
    fontWeight: '600',
  },
  abonoFecha: {
    color: c.textMuted,
    fontSize: 12,
  },
  abonoMonto: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 13,
    minWidth: 55,
    textAlign: 'right',
  },
});
