import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, SearchBar, Badge, Card, EmptyState } from '../components/ui';
import { productosService } from '../services/inventario';
import { clientesService } from '../services/clientes';
import { ventasService } from '../services/ventas';

const METODOS = [
  { value: 'EFECTIVO', label: 'Efectivo', icon: 'cash-outline' },
  { value: 'TARJETA', label: 'Tarjeta', icon: 'card-outline' },
  { value: 'TRANSFERENCIA', label: 'Transfer.', icon: 'swap-horizontal-outline' },
];

const fmt = n => `$${Number(n || 0).toFixed(2)}`;

export default function VentasScreen() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [tab, setTab] = useState('nueva');

  return (
    <Screen>
      <Header
        title="Ventas"
        subtitle={tab === 'nueva' ? 'Registra una nueva venta' : 'Historial de ventas'}
        right={
          <View style={styles.segmented}>
            <TouchableOpacity
              style={[styles.segBtn, tab === 'nueva' && styles.segActive]}
              onPress={() => setTab('nueva')}
            >
              <Text style={[styles.segText, tab === 'nueva' && styles.segTextActive]}>Nueva</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segBtn, tab === 'historial' && styles.segActive]}
              onPress={() => setTab('historial')}
            >
              <Text style={[styles.segText, tab === 'historial' && styles.segTextActive]}>Historial</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {tab === 'nueva' ? <NuevaVenta /> : <HistorialVentas />}
    </Screen>
  );
}

/* ==================== NUEVA VENTA ==================== */

function NuevaVenta() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  // datos
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // carrito
  const [cart, setCart] = useState([]); // {id, nombre, precio, cantidad, stock}
  const [cliente, setCliente] = useState(null);

  // pagos
  const [pagos, setPagos] = useState([]); // {metodo, monto}
  const [metodoSel, setMetodoSel] = useState('EFECTIVO');
  const [montoPago, setMontoPago] = useState('');

  // modales
  const [cliVisible, setCliVisible] = useState(false);
  const [cliQuery, setCliQuery] = useState('');
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null); // venta creada (modal éxito)

  const cargarProductos = useCallback(async () => {
    try {
      setLoading(true);
      const params = { estado: 'true' };
      if (query.trim()) params.search = query.trim();
      const { data } = await productosService.list(params);
      setProductos(data.results || data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(cargarProductos, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargarProductos]);

  const abrirClientes = async () => {
    setCliVisible(true);
    try {
      const { data } = await clientesService.list({ estado: 'true' });
      setClientes(data.results || data);
    } catch {
      setClientes([]);
    }
  };

  const clientesFiltrados = useMemo(() => {
    const q = cliQuery.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      c => c.nombre.toLowerCase().includes(q) || (c.documento || '').includes(q),
    );
  }, [clientes, cliQuery]);

  const agregarAlCarrito = (p) => {
    setError('');
    setCart(prev => {
      const existe = prev.find(i => i.id === p.id);
      const stock = p.stock_actual ?? 0;
      if (existe) {
        if (existe.cantidad + 1 > stock) {
          setError(`Stock insuficiente de ${p.nombre}. Disponible: ${stock}.`);
          return prev;
        }
        return prev.map(i => (i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      if (stock < 1) {
        setError(`${p.nombre} sin stock disponible.`);
        return prev;
      }
      return [...prev, {
        id: p.id,
        nombre: p.nombre,
        precio: Number(p.precio_venta),
        cantidad: 1,
        stock,
      }];
    });
  };

  const cambiarCantidad = (id, delta) => {
    setCart(prev => prev
      .map(i => {
        if (i.id !== id) return i;
        const nueva = i.cantidad + delta;
        if (nueva > i.stock) {
          setError(`Stock insuficiente de ${i.nombre}. Disponible: ${i.stock}.`);
          return i;
        }
        return { ...i, cantidad: nueva };
      })
      .filter(i => i.cantidad > 0));
  };

  const total = useMemo(() => cart.reduce((a, i) => a + i.precio * i.cantidad, 0), [cart]);
  const pagado = useMemo(() => pagos.reduce((a, p) => a + Number(p.monto), 0), [pagos]);
  const resta = Math.max(total - pagado, 0);

  const agregarPago = () => {
    setError('');
    const monto = parseFloat(montoPago);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un monto de pago válido.');
      return;
    }
    if (monto - resta > 0.009) {
      setError('Los pagos no pueden exceder el total de la venta.');
      return;
    }
    setPagos(prev => [...prev, { metodo: metodoSel, monto }]);
    setMontoPago('');
  };

  const confirmarVenta = () => {
    setError('');
    if (!cart.length) {
      setError('Agrega al menos un producto.');
      return;
    }
    if (resta > 0.009 && !cliente) {
      setError('El saldo restante quedará a crédito: selecciona un cliente.');
      return;
    }
    Alert.alert('Confirmar venta', `Total: ${fmt(total)}${resta > 0.009 ? `\nCrédito: ${fmt(resta)}` : ''}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Registrar', onPress: registrarVenta },
    ]);
  };

  const registrarVenta = async () => {
    try {
      setSaving(true);
      const { data } = await ventasService.create({
        cliente: cliente?.id || null,
        items: cart.map(i => ({ producto: i.id, cantidad: i.cantidad })),
        pagos,
      });
      setResultado(data);
      setCart([]);
      setPagos([]);
      setCliente(null);
      setMontoPago('');
      cargarProductos();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' && d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : 'No se pudo registrar la venta';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Cliente seleccionado */}
      <TouchableOpacity style={styles.clientBar} activeOpacity={0.8} onPress={abrirClientes}>
        <Ionicons name="person" size={15} color={c.goldLight} />
        <Text style={styles.clientBarText} numberOfLines={1}>
          {cliente ? cliente.nombre : 'Consumidor final (sin cliente)'}
        </Text>
        {cliente && (
          <TouchableOpacity onPress={() => setCliente(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={17} color={c.textMuted} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-down" size={14} color={c.textMuted} style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {/* Buscador de productos */}
      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar producto para agregar..." />
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.prodList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="wine-outline" title="Sin resultados" />}
          renderItem={({ item }) => {
            const sinStock = (item.stock_actual ?? 0) < 1;
            return (
              <TouchableOpacity
                style={[styles.prodRow, sinStock && { opacity: 0.45 }]}
                activeOpacity={0.7}
                disabled={sinStock}
                onPress={() => agregarAlCarrito(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.prodName} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={styles.prodStock}>Stock: {item.stock_actual ?? 0}</Text>
                </View>
                <Text style={styles.prodPrice}>{fmt(item.precio_venta)}</Text>
                <View style={styles.addBtn}>
                  <Ionicons name="add" size={18} color="#1A1408" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Panel de venta */}
      <View style={styles.panel}>
        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={14} color={c.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {cart.length === 0 ? (
          <Text style={styles.cartEmpty}>Toca un producto para agregarlo a la venta.</Text>
        ) : (
          <ScrollView horizontal={false} style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
            {cart.map(i => (
              <View key={String(i.id)} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName} numberOfLines={1}>{i.nombre}</Text>
                  <Text style={styles.cartSub}>{fmt(i.precio)} c/u</Text>
                </View>
                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => cambiarCantidad(i.id, -1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar una unidad de ${i.nombre}`}
                  >
                    <Ionicons name="remove" size={16} color={c.danger} />
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{i.cantidad}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => cambiarCantidad(i.id, 1)}
                    accessibilityRole="button"
                    accessibilityLabel={`Agregar una unidad de ${i.nombre}`}
                  >
                    <Ionicons name="add" size={16} color={c.success} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartTotal}>{fmt(i.precio * i.cantidad)}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Pagos */}
        <View style={styles.paySection}>
          <View style={styles.metodosRow}>
            {METODOS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[styles.metodoChip, metodoSel === m.value && styles.metodoChipActive]}
                onPress={() => setMetodoSel(m.value)}
              >
                <Ionicons
                  name={m.icon}
                  size={13}
                  color={metodoSel === m.value ? c.sobreDorado : c.textSecondary}
                />
                <Text style={[styles.metodoText, metodoSel === m.value && styles.metodoTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.payRow}>
            <TextInput
              style={styles.payInput}
              value={montoPago}
              onChangeText={v => setMontoPago(v.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder={`Monto (resta ${fmt(resta)})`}
              placeholderTextColor={c.textMuted}
            />
            <TouchableOpacity style={styles.addPayBtn} onPress={agregarPago}>
              <Ionicons name="add" size={15} color="#1A1408" />
              <Text style={styles.addPayText}>Pago</Text>
            </TouchableOpacity>
          </View>

          {pagos.map((p, idx) => (
            <View key={idx} style={styles.pagoItem}>
              <Ionicons
                name={METODOS.find(m => m.value === p.metodo)?.icon || 'cash-outline'}
                size={12}
                color={c.goldLight}
              />
              <Text style={styles.pagoMetodo}>{p.metodo}</Text>
              <Text style={styles.pagoMonto}>{fmt(p.monto)}</Text>
              <TouchableOpacity onPress={() => setPagos(prev => prev.filter((_, i) => i !== idx))}>
                <Ionicons name="trash-outline" size={13} color={c.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsRow}>
          <View>
            <Text style={styles.totalLabel}>TOTAL</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalLabel}>{resta > 0.009 ? 'A CRÉDITO' : 'CAMBIO/RESTO'}</Text>
            <Text style={[styles.totalValue, { color: resta > 0.009 ? c.danger : c.success }]}>
              {fmt(resta)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, (!cart.length || saving) && { opacity: 0.5 }]}
          onPress={confirmarVenta}
          disabled={!cart.length || saving}
        >
          {saving
            ? <ActivityIndicator size="small" color="#1A1408" />
            : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#1A1408" />
                <Text style={styles.confirmText}>Registrar venta</Text>
              </>
            )}
        </TouchableOpacity>
      </View>

      {/* Modal selección de cliente */}
      <Modal visible={cliVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { maxHeight: '70%', justifyContent: 'flex-start' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar cliente</Text>
              <TouchableOpacity onPress={() => setCliVisible(false)}>
                <Ionicons name="close" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <SearchBar value={cliQuery} onChangeText={setCliQuery} placeholder="Buscar cliente..." />
            <FlatList
              data={clientesFiltrados}
              keyExtractor={item => String(item.id)}
              style={{ marginTop: 10 }}
              ListEmptyComponent={<Text style={styles.emptyText}>Sin clientes.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cliRow}
                  onPress={() => { setCliente(item); setCliVisible(false); }}
                >
                  <Ionicons name="person-circle-outline" size={22} color={c.goldLight} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.cliName} numberOfLines={1}>{item.nombre}</Text>
                    {item.documento ? <Text style={styles.cliDoc}>{item.documento}</Text> : null}
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Modal éxito */}
      <Modal visible={!!resultado} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <Ionicons name="checkmark-circle" size={54} color={c.success} />
            <Text style={styles.successTitle}>Venta registrada</Text>
            <Text style={styles.successNumero}>{resultado?.numero}</Text>
            <Text style={styles.successTotal}>{fmt(resultado?.total)}</Text>
            {resultado?.deuda && (
              <View style={styles.deudaBox}>
                <Ionicons name="time-outline" size={14} color={c.danger} />
                <Text style={styles.deudaText}>
                  Crédito generado: {fmt(resultado.deuda.saldo_pendiente)} para {resultado.cliente_nombre}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.okBtn} onPress={() => setResultado(null)}>
              <Text style={styles.okText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ==================== HISTORIAL ==================== */

function HistorialVentas() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await ventasService.list();
      setVentas(data.results || data);
    } catch {
      setVentas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const anular = (venta) => {
    Alert.alert('Anular venta', `¿Anular ${venta.numero}? Se restaurará el stock.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Anular',
        style: 'destructive',
        onPress: async () => {
          try {
            await ventasService.anular(venta.id);
            setDetalle(null);
            cargar();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.detail || 'No se pudo anular la venta.');
          }
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1 }}>
      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ventas}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.histList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState icon="receipt-outline" title="Sin ventas registradas" />}
          renderItem={({ item }) => (
            <Card style={styles.ventaCard}>
              <TouchableOpacity
                style={styles.ventaMain}
                activeOpacity={0.8}
                onPress={() => setDetalle(item)}
              >
                <View style={styles.ventaIcon}>
                  <Ionicons name="receipt" size={17} color={c.goldLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ventaNumero}>{item.numero}</Text>
                  <Text style={styles.ventaFecha}>
                    {new Date(item.fecha).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {item.cliente_nombre ? ` · ${item.cliente_nombre}` : ''}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.ventaTotal}>{fmt(item.total)}</Text>
                  <Badge
                    label={item.estado}
                    tone={item.estado === 'COMPLETADA' ? 'success' : 'danger'}
                    size="xs"
                  />
                </View>
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      {/* Detalle de venta */}
      <Modal visible={!!detalle} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { maxHeight: '80%', justifyContent: 'flex-start' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{detalle?.numero}</Text>
                <Text style={styles.modalSub}>
                  {detalle?.cliente_nombre || 'Consumidor final'} · {' '}
                  {detalle && new Date(detalle.fecha).toLocaleString('es-EC')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDetalle(null)}>
                <Ionicons name="close" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionLabel}>PRODUCTOS</Text>
              {detalle?.detalles?.map(d => (
                <View key={String(d.id)} style={styles.detRow}>
                  <Text style={styles.detCant}>{d.cantidad}x</Text>
                  <Text style={styles.detName} numberOfLines={1}>{d.nombre_producto}</Text>
                  <Text style={styles.detSubtotal}>{fmt(d.subtotal)}</Text>
                </View>
              ))}

              <Text style={styles.sectionLabel}>PAGOS</Text>
              {detalle?.pagos?.map(p => (
                <View key={String(p.id)} style={styles.detRow}>
                  <Ionicons
                    name={METODOS.find(m => m.value === p.metodo)?.icon || 'cash-outline'}
                    size={13}
                    color={c.goldLight}
                  />
                  <Text style={[styles.detName, { marginLeft: 8 }]}>{p.metodo}</Text>
                  <Text style={styles.detSubtotal}>{fmt(p.monto)}</Text>
                </View>
              ))}

              <View style={styles.detTotals}>
                <Text style={styles.detTotalsLabel}>TOTAL</Text>
                <Text style={styles.detTotalsValue}>{fmt(detalle?.total)}</Text>
              </View>

              {detalle?.estado === 'COMPLETADA' && (
                <TouchableOpacity style={styles.anularBtn} onPress={() => anular(detalle)}>
                  <Ionicons name="ban-outline" size={15} color={c.danger} />
                  <Text style={styles.anularText}>Anular venta</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const crearEstilos = c => StyleSheet.create({
  segmented: {
    flexDirection: 'row',
    backgroundColor: c.card,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.border,
    padding: 3,
  },
  segBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
  },
  segActive: {
    backgroundColor: c.gold,
  },
  segText: {
    fontSize: 12,
    fontWeight: '700',
    color: c.textSecondary,
  },
  segTextActive: {
    color: c.sobreDorado,
  },
  clientBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 7,
  },
  clientBarText: {
    flex: 1,
    color: c.text,
    fontSize: 13,
    fontWeight: '600',
  },
  prodList: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  prodName: {
    color: c.text,
    fontWeight: '700',
    fontSize: 14,
  },
  prodStock: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  prodPrice: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 14,
    marginRight: 10,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: c.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 10,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  errorText: {
    color: c.danger,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  cartEmpty: {
    color: c.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  cartName: {
    color: c.text,
    fontSize: 13,
    fontWeight: '700',
  },
  cartSub: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.borderSubtle,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
  },
  qtyNum: {
    color: c.text,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
    fontSize: 13,
  },
  cartTotal: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 13,
    width: 62,
    textAlign: 'right',
  },
  paySection: {
    marginTop: 8,
  },
  metodosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  metodoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    fontSize: 11,
    fontWeight: '700',
    color: c.textSecondary,
  },
  metodoTextActive: {
    color: c.sobreDorado,
  },
  payRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  payInput: {
    flex: 1,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.sm,
    color: c.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.gold,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
  },
  addPayText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 13,
  },
  pagoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  pagoMetodo: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pagoMonto: {
    color: c.text,
    fontSize: 12,
    fontWeight: '700',
    marginRight: 10,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: c.textMuted,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: c.goldLight,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: c.gold,
    borderRadius: radius.md,
    paddingVertical: 13,
    marginTop: 10,
  },
  confirmText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 15,
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
  emptyText: {
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 20,
  },
  cliRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  cliName: {
    color: c.text,
    fontWeight: '700',
    fontSize: 14,
  },
  cliDoc: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  successTitle: {
    ...type.h2,
    color: c.text,
    marginTop: 10,
  },
  successNumero: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 1,
  },
  successTotal: {
    color: c.text,
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  deudaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  deudaText: {
    color: c.danger,
    fontSize: 12,
    marginLeft: 6,
    flex: 1,
  },
  okBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: c.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: 16,
  },
  okText: {
    color: c.sobreDorado,
    fontWeight: '800',
  },
  histList: {
    padding: spacing.lg,
    paddingTop: 12,
    paddingBottom: 100,
  },
  ventaCard: {
    marginBottom: 10,
    padding: 0,
    overflow: 'hidden',
  },
  ventaMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  ventaIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: c.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ventaNumero: {
    color: c.text,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  ventaFecha: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  ventaTotal: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 15,
  },
  sectionLabel: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.5,
    marginTop: 14,
    marginBottom: 6,
  },
  detRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  detCant: {
    color: c.goldLight,
    fontWeight: '800',
    width: 32,
    fontSize: 13,
  },
  detName: {
    flex: 1,
    color: c.text,
    fontSize: 13,
    fontWeight: '600',
  },
  detSubtotal: {
    color: c.text,
    fontWeight: '700',
    fontSize: 13,
  },
  detTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  detTotalsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: c.textMuted,
  },
  detTotalsValue: {
    color: c.goldLight,
    fontSize: 22,
    fontWeight: '800',
  },
  anularBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: 11,
    marginTop: 16,
  },
  anularText: {
    color: c.danger,
    fontWeight: '700',
    fontSize: 13,
  },
});
