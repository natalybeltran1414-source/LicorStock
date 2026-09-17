import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, SearchBar, Badge, FAB, Card, Avatar } from '../components/ui';
import { clientesService } from '../services/clientes';

const TIPOS_DOC = [
  { value: 'CEDULA', label: 'Cédula' },
  { value: 'RUC', label: 'RUC' },
  { value: 'CONSUMIDOR', label: 'Consumidor final' },
];

const FORM_INICIAL = {
  nombre: '',
  tipo_documento: 'CEDULA',
  documento: '',
  telefono: '',
  email: '',
  direccion: '',
};

export default function ClientesScreen() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [clientes, setClientes] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const params = query.trim() ? { search: query.trim() } : {};
      const { data } = await clientesService.list(params);
      setClientes(data.results || data);
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const t = setTimeout(cargar, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirCrear = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setFormError('');
    setFormVisible(true);
  };

  const abrirEditar = (cliente) => {
    setEditando(cliente);
    setForm({
      nombre: cliente.nombre || '',
      tipo_documento: cliente.tipo_documento || 'CEDULA',
      documento: cliente.documento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      direccion: cliente.direccion || '',
    });
    setFormError('');
    setFormVisible(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        documento: form.documento.trim() || null,
        telefono: form.telefono.trim() || null,
        email: form.email.trim() || null,
        direccion: form.direccion.trim() || null,
      };
      if (editando) {
        await clientesService.update(editando.id, payload);
      } else {
        await clientesService.create(payload);
      }
      setFormVisible(false);
      cargar();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' && d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : 'No se pudo guardar el cliente';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = (cliente) => {
    Alert.alert('Desactivar cliente', `¿Desactivar a ${cliente.nombre}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await clientesService.remove(cliente.id);
            cargar();
          } catch {
            Alert.alert('Error', 'No se pudo desactivar el cliente.');
          }
        },
      },
    ]);
  };

  return (
    <Screen>
      <Header
        title="Clientes"
        subtitle={`${clientes.length} registrados`}
      />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nombre, cédula o teléfono..." />
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.empty}>Sin clientes registrados.</Text>}
          renderItem={({ item }) => (
            <Card style={styles.clientCard}>
              <TouchableOpacity
                style={styles.clientMain}
                activeOpacity={0.8}
                onPress={() => abrirEditar(item)}
                onLongPress={() => confirmarEliminar(item)}
              >
                <Avatar name={item.nombre} tone={item.estado ? 'gold' : 'danger'} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.name, !item.estado && { color: c.textMuted }]} numberOfLines={1}>
                      {item.nombre}
                    </Text>
                    {!item.estado && <Badge label="INACTIVO" tone="danger" />}
                  </View>
                  <View style={styles.infoRow}>
                    {item.documento ? (
                      <>
                        <Ionicons name="card-outline" size={12} color={c.textMuted} />
                        <Text style={styles.info}>{item.documento}</Text>
                      </>
                    ) : null}
                    {item.telefono ? (
                      <>
                        <Ionicons name="call-outline" size={12} color={c.textMuted} style={{ marginLeft: 10 }} />
                        <Text style={styles.info}>{item.telefono}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
              </TouchableOpacity>
            </Card>
          )}
        />
      )}

      <FAB icon="person-add" onPress={abrirCrear} />

      {/* Modal crear/editar */}
      <Modal visible={formVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <ScrollView contentContainerStyle={styles.scrollCenter} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</Text>

              <Text style={styles.label}>NOMBRE *</Text>
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={v => setForm({ ...form, nombre: v })}
                placeholder="Nombre completo"
                placeholderTextColor={c.textMuted}
              />

              <Text style={styles.label}>TIPO DE DOCUMENTO</Text>
              <View style={styles.docRow}>
                {TIPOS_DOC.map(t => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.docChip, form.tipo_documento === t.value && styles.docChipActive]}
                    onPress={() => setForm({ ...form, tipo_documento: t.value })}
                  >
                    <Text
                      style={[
                        styles.docChipText,
                        form.tipo_documento === t.value && styles.docChipTextActive,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {form.tipo_documento !== 'CONSUMIDOR' && (
                <>
                  <Text style={styles.label}>{form.tipo_documento === 'RUC' ? 'RUC' : 'CÉDULA'} *</Text>
                  <TextInput
                    style={styles.input}
                    value={form.documento}
                    onChangeText={v => setForm({ ...form, documento: v.replace(/[^0-9]/g, '') })}
                    keyboardType="number-pad"
                    placeholder="Número de documento"
                    placeholderTextColor={c.textMuted}
                  />
                </>
              )}

              <Text style={styles.label}>TELÉFONO</Text>
              <TextInput
                style={styles.input}
                value={form.telefono}
                onChangeText={v => setForm({ ...form, telefono: v })}
                keyboardType="phone-pad"
                placeholder="09xxxxxxxx"
                placeholderTextColor={c.textMuted}
              />

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={v => setForm({ ...form, email: v })}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="correo@ejemplo.com"
                placeholderTextColor={c.textMuted}
              />

              <Text style={styles.label}>DIRECCIÓN</Text>
              <TextInput
                style={styles.input}
                value={form.direccion}
                onChangeText={v => setForm({ ...form, direccion: v })}
                placeholder="Dirección domiciliaria"
                placeholderTextColor={c.textMuted}
              />

              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={15} color={c.danger} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
                  onPress={guardar}
                  disabled={saving}
                >
                  {saving
                    ? <ActivityIndicator size="small" color={c.sobreDorado} />
                    : <Text style={styles.confirmText}>{editando ? 'Guardar' : 'Crear'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  clientCard: {
    marginBottom: 12,
    padding: 0,
    overflow: 'hidden',
  },
  clientMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  name: {
    ...type.body,
    fontWeight: '700',
    color: c.text,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  info: {
    color: c.textMuted,
    fontSize: 12,
    marginLeft: 5,
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
  modalTitle: {
    ...type.h2,
    color: c.text,
    marginBottom: 4,
  },
  label: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 14,
  },
  docRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.card,
  },
  docChipActive: {
    borderColor: c.gold,
    backgroundColor: c.goldSoft,
  },
  docChipText: {
    color: c.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  docChipTextActive: {
    color: c.goldLight,
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
    marginTop: 14,
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
});
