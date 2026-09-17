import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, Card, ProgressBar, EmptyState } from '../components/ui';
import { productosService } from '../services/inventario';
import { ventasService, deudasService } from '../services/ventas';
import { getSession } from '../services/api';

const fmt = n => `$${Number(n || 0).toFixed(2)}`;
const fmtCorto = n => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toFixed(0)}`);

export default function DashboardScreen({ navigation }) {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [usuario, setUsuario] = useState(null);
  const [ventasRes, setVentasRes] = useState(null);
  const [semanal, setSemanal] = useState([]);
  const [invRes, setInvRes] = useState(null);
  const [cxcRes, setCxcRes] = useState(null);
  const [top, setTop] = useState([]);
  const [bajoStock, setBajoStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [vRes, sRes, iRes, cRes, tRes, bRes] = await Promise.allSettled([
        ventasService.resumen(),
        ventasService.semanal(),
        productosService.resumen(),
        deudasService.resumen(),
        ventasService.topProductos({ dias: 30 }),
        productosService.bajoStock(),
      ]);
      if (vRes.status === 'fulfilled') setVentasRes(vRes.value.data);
      if (sRes.status === 'fulfilled') setSemanal(sRes.value.data || []);
      if (iRes.status === 'fulfilled') setInvRes(iRes.value.data);
      if (cRes.status === 'fulfilled') setCxcRes(cRes.value.data);
      if (tRes.status === 'fulfilled') setTop(tRes.value.data.results || tRes.value.data);
      if (bRes.status === 'fulfilled') setBajoStock(bRes.value.data.results || bRes.value.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await getSession();
        setUsuario(session?.user || null);
      } catch {
        // silencioso
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const saludo = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  })();

  const fecha = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
  const hoyISO = new Date().toLocaleDateString('en-CA');
  const maxSem = Math.max(...semanal.map(d => d.total || 0), 1);
  const maxUnidades = Math.max(...top.map(t => t.unidades), 1);

  return (
    <Screen>
      <Header
        title={`${saludo}${usuario?.first_name || usuario?.username ? ',' : ''}`}
        subtitle={fecha.charAt(0).toUpperCase() + fecha.slice(1)}
        right={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.bell, bajoStock.length > 0 && styles.bellAlert]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Inventario')}
              accessibilityRole="button"
              accessibilityLabel={
                bajoStock.length > 0
                  ? `Alertas: ${bajoStock.length} productos con bajo stock`
                  : 'Sin alertas de inventario'
              }
            >
              <Ionicons name="notifications" size={20} color={bajoStock.length > 0 ? c.warning : c.gold} />
              {bajoStock.length > 0 && <View style={styles.dot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bell}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Perfil')}
              accessibilityRole="button"
              accessibilityLabel="Abrir mi perfil"
            >
              <Ionicons name="person-circle-outline" size={24} color={c.gold} />
            </TouchableOpacity>
          </View>
        }
      />

      {loading ? (
        <ActivityIndicator color={c.gold} size="large" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.gold} />}
        >
          {/* Hero: ventas del día */}
          <Card glow style={styles.hero}>
            <Text style={styles.heroLabel}>VENTAS DE HOY</Text>
            <Text style={styles.heroValue}>{fmt(ventasRes?.total_hoy)}</Text>
            <Text style={styles.heroSub}>{ventasRes?.ventas_hoy || 0} transacciones registradas</Text>
          </Card>

          {/* KPIs accionables */}
          <View style={styles.kpiRow}>
            <TouchableOpacity
              style={[styles.kpi, styles.kpiDanger]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Cuentas')}
            >
              <View style={styles.kpiHead}>
                <Ionicons name="wallet-outline" size={16} color={c.danger} />
                <Text style={styles.kpiLabel}>POR COBRAR</Text>
              </View>
              <Text style={[styles.kpiValue, { color: c.danger }]}>{fmt(cxcRes?.total_por_cobrar)}</Text>
              <View style={styles.kpiFoot}>
                <Text style={styles.kpiSub}>{cxcRes?.deudas_pendientes || 0} deudas</Text>
                <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.kpi, styles.kpiGold]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Inventario')}
            >
              <View style={styles.kpiHead}>
                <Ionicons name="alert-circle-outline" size={16} color={c.goldLight} />
                <Text style={styles.kpiLabel}>BAJO STOCK</Text>
              </View>
              <Text style={[styles.kpiValue, { color: c.goldLight }]}>{invRes?.bajo_stock ?? 0}</Text>
              <View style={styles.kpiFoot}>
                <Text style={styles.kpiSub}>productos</Text>
                <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Gráfico semanal */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>VENTAS · ÚLTIMOS 7 DÍAS</Text>
            <Text style={styles.link}>{fmt(semanal.reduce((s, d) => s + (d.total || 0), 0))}</Text>
          </View>
          <Card style={styles.chartCard}>
            <View style={styles.chartRow}>
              {semanal.map(d => {
                const esHoy = d.fecha === hoyISO;
                const altura = maxSem > 0 && d.total > 0
                  ? Math.max(10, (d.total / maxSem) * 92)
                  : 3;
                return (
                  <View key={d.fecha} style={styles.chartCol}>
                    {d.total > 0 && (
                      <Text style={styles.chartVal} numberOfLines={1}>{fmtCorto(d.total)}</Text>
                    )}
                    <View style={styles.barTrack}>
                      <LinearGradient
                        colors={c.gradients.gold}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={[styles.bar, { height: altura }, !esHoy && d.total > 0 && styles.barDim]}
                      />
                    </View>
                    <Text style={[styles.chartDay, esHoy && styles.chartDayHoy]}>{d.nombre}</Text>
                  </View>
                );
              })}
            </View>
          </Card>

          {/* Inventario resumen */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>INVENTARIO</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Productos')}>
              <Text style={styles.link}>Ver productos</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.invCard}>
            <View style={styles.invItem}>
              <Ionicons name="wine-outline" size={16} color={c.goldLight} />
              <Text style={styles.invLabel}>Productos activos</Text>
              <Text style={styles.invValue}>{invRes?.total_productos ?? 0}</Text>
            </View>
            <View style={[styles.invItem, styles.invDivider]}>
              <Ionicons name="cube-outline" size={16} color={c.goldLight} />
              <Text style={styles.invLabel}>Unidades</Text>
              <Text style={styles.invValue}>{invRes?.unidades_totales ?? 0}</Text>
            </View>
            <View style={[styles.invItem, styles.invDivider]}>
              <Ionicons name="cash-outline" size={16} color={c.goldLight} />
              <Text style={styles.invLabel}>Valor</Text>
              <Text style={styles.invValue}>{fmt(invRes?.valor_inventario)}</Text>
            </View>
          </Card>

          {/* Top productos */}
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>MÁS VENDIDOS · 30 DÍAS</Text>
          </View>
          <Card style={{ paddingVertical: 6 }}>
            {top.length === 0 ? (
              <EmptyState icon="trending-up-outline" title="Sin ventas aún" subtitle="Registra tu primera venta." />
            ) : (
              top.map((t, i) => (
                <View key={`${t.nombre_producto}-${i}`} style={[styles.topItem, i < top.length - 1 && styles.divider]}>
                  <View style={styles.topRank}>
                    <Text style={styles.topRankText}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topName} numberOfLines={1}>{t.nombre_producto}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 7 }}>
                      <ProgressBar ratio={t.unidades / maxUnidades} tone="gold" />
                      <Text style={styles.topUnits}>{t.unidades} unids</Text>
                    </View>
                  </View>
                  <Text style={styles.topIngresos}>{fmt(t.ingresos)}</Text>
                </View>
              ))
            )}
          </Card>

          {/* Bajo stock */}
          {bajoStock.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>REQUIERE ATENCIÓN</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Inventario')}>
                  <Text style={styles.link}>Ver inventario</Text>
                </TouchableOpacity>
              </View>
              <Card style={{ paddingVertical: 4 }}>
                {bajoStock.slice(0, 5).map((p, i) => (
                  <View key={String(p.id)} style={[styles.stockItem, i < Math.min(bajoStock.length, 5) - 1 && styles.divider]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.stockName} numberOfLines={1}>{p.nombre}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                        <ProgressBar ratio={(p.stock_actual ?? 0) / Math.max(1, p.stock_minimo)} tone="warning" />
                        <Text style={styles.stockNum}>{p.stock_actual ?? 0}/{p.stock_minimo}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

const crearEstilos = c => StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bell: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellAlert: {
    borderColor: 'rgba(255,176,32,0.35)',
    backgroundColor: c.warningSoft,
  },
  dot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: c.warning,
    borderWidth: 1.5,
    borderColor: c.card,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 22,
    marginBottom: spacing.md,
  },
  chartCard: {
    marginBottom: spacing.lg,
    paddingBottom: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
  },
  chartVal: {
    color: c.goldLight,
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
    maxWidth: '110%',
  },
  barTrack: {
    width: '62%',
    height: 100,
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  barDim: {
    opacity: 0.45,
  },
  chartDay: {
    color: c.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 8,
  },
  chartDayHoy: {
    color: c.goldLight,
  },
  heroLabel: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 2,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: '800',
    color: c.goldLight,
    letterSpacing: -1,
    marginTop: 8,
  },
  heroSub: {
    ...type.small,
    color: c.textMuted,
    marginTop: 6,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: spacing.lg,
  },
  kpi: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  kpiDanger: {
    borderColor: 'rgba(255,107,107,0.25)',
  },
  kpiGold: {
    borderColor: c.border,
  },
  kpiHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  kpiLabel: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.5,
    fontSize: 10,
  },
  kpiValue: {
    fontSize: 22,
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
    color: c.textMuted,
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
    color: c.textSecondary,
    letterSpacing: 1.6,
  },
  link: {
    color: c.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  invCard: {
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  invItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  invDivider: {
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
  },
  invLabel: {
    flex: 1,
    color: c.textSecondary,
    fontSize: 13,
    marginLeft: 10,
  },
  invValue: {
    color: c.text,
    fontWeight: '800',
    fontSize: 15,
  },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  topRank: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    backgroundColor: c.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topRankText: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 13,
  },
  topName: {
    ...type.body,
    color: c.text,
    fontWeight: '700',
  },
  topUnits: {
    color: c.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 10,
  },
  topIngresos: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 13,
    marginLeft: 10,
    minWidth: 62,
    textAlign: 'right',
  },
  stockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  stockName: {
    ...type.body,
    color: c.text,
  },
  stockNum: {
    color: c.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 10,
    width: 44,
    textAlign: 'right',
  },
});
