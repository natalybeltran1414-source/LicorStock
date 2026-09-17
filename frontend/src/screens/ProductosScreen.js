import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { radius, type, spacing } from '../theme/colors';
import { PALETA_CATEGORIAS } from '../theme/theme';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, SearchBar, Chip, Badge, FAB, Card, GoldButton } from '../components/ui';
import { productosService, categoriasService } from '../services/inventario';

const EMPTY_FORM = {
  nombre: '',
  categoria: null,
  descripcion: '',
  precio_compra: '',
  precio_venta: '',
  stock_minimo: '5',
  stock_inicial: '0',
  unidad: 'UNIDAD',
};

const UNIDADES = [
  { value: 'UNIDAD', label: 'Unidad' },
  { value: 'ML', label: 'ml' },
  { value: 'LT', label: 'Litro' },
  { value: 'KG', label: 'Kg' },
  { value: 'G', label: 'Gramo' },
  { value: 'CAJA', label: 'Caja' },
  { value: 'PACK', label: 'Pack' },
  { value: 'SIXPACK', label: 'Six-pack' },
];

const margenPct = p => {
  const c = Number(p.precio_compra) || 0;
  const v = Number(p.precio_venta) || 0;
  if (c <= 0) return null;
  return Math.round(((v - c) / c) * 100);
};

export default function ProductosScreen() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [query, setQuery] = useState('');
  const [catFiltro, setCatFiltro] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [nuevaCat, setNuevaCat] = useState('');
  const [nuevaCatInline, setNuevaCatInline] = useState(false);
  const [nuevaCatTexto, setNuevaCatTexto] = useState('');
  const [colorSel, setColorSel] = useState(PALETA_CATEGORIAS[0]);
  const [fotoNueva, setFotoNueva] = useState(null);
  const [quitarFoto, setQuitarFoto] = useState(false);
  const [editandoCatId, setEditandoCatId] = useState(null);
  const [editCatTexto, setEditCatTexto] = useState('');
  const [editCatColor, setEditCatColor] = useState(PALETA_CATEGORIAS[0]);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (query.trim()) params.search = query.trim();
      if (catFiltro !== 'Todos') {
        const cat = categorias.find(c => c.nombre === catFiltro);
        if (cat) params.categoria = cat.id;
      }
      const { data } = await productosService.list(params);
      setProductos(data.results || data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  }, [query, catFiltro, categorias]);

  useEffect(() => {
    categoriasService.list()
      .then(({ data }) => setCategorias(data.results || data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(cargar, query ? 400 : 0);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirCrear = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setColorSel(PALETA_CATEGORIAS[0]);
    setFotoNueva(null);
    setQuitarFoto(false);
    setModalVisible(true);
  };

  const abrirEditar = (p) => {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      categoria: p.categoria,
      descripcion: p.descripcion || '',
      precio_compra: String(p.precio_compra),
      precio_venta: String(p.precio_venta),
      stock_minimo: String(p.stock_minimo),
      stock_inicial: '0',
      unidad: p.unidad || 'UNIDAD',
    });
    setFormError('');
    setColorSel(PALETA_CATEGORIAS[0]);
    setFotoNueva(null);
    setQuitarFoto(false);
    setModalVisible(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim() || !form.categoria || !form.precio_venta) {
      setFormError('Nombre, categoría y precio de venta son obligatorios.');
      return;
    }
    try {
      setSaving(true);
      setFormError('');
      const payload = {
        nombre: form.nombre.trim(),
        categoria: form.categoria,
        descripcion: form.descripcion.trim() || null,
        precio_compra: parseFloat(form.precio_compra || '0'),
        precio_venta: parseFloat(form.precio_venta),
        stock_minimo: parseInt(form.stock_minimo || '5', 10),
        unidad: form.unidad,
      };
      let guardado = null;
      if (editing) {
        const { data } = await productosService.update(editing.id, payload);
        guardado = data;
      } else {
        payload.stock_inicial = parseInt(form.stock_inicial || '0', 10);
        const { data } = await productosService.create(payload);
        guardado = data;
      }
      if (fotoNueva) {
        try {
          await productosService.subirImagen(guardado.id, fotoNueva);
        } catch {
          Alert.alert('Aviso', 'El producto se guardó pero la imagen no pudo subirse.');
        }
      } else if (quitarFoto && editing?.imagen) {
        try {
          await productosService.quitarImagen(editing.id);
        } catch {}
      }
      setModalVisible(false);
      cargar();
    } catch (err) {
      const d = err.response?.data;
      const msg = typeof d === 'object' && d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        : 'No se pudo guardar el producto';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const confirmarEliminar = (p) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${p.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await productosService.remove(p.id);
            cargar();
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const crearCategoria = async () => {
    if (!nuevaCat.trim()) return;
    try {
      const { data } = await categoriasService.create({ nombre: nuevaCat.trim(), color: colorSel });
      setCategorias(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaCat('');
    } catch (err) {
      const d = err.response?.data;
      Alert.alert('Error', d?.nombre?.[0] || 'No se pudo crear la categoría');
    }
  };

  const crearCategoriaInline = async () => {
    const nombre = nuevaCatTexto.trim();
    if (!nombre) return;
    try {
      const { data } = await categoriasService.create({ nombre, color: colorSel });
      setCategorias(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setForm(f => ({ ...f, categoria: data.id }));
      setNuevaCatTexto('');
      setNuevaCatInline(false);
    } catch (err) {
      const d = err.response?.data;
      Alert.alert('Error', d?.nombre?.[0] || 'No se pudo crear la categoría');
    }
  };

  const abrirOpcionesFoto = () => {
    const hayFoto = !!fotoNueva || (!!editing?.imagen && !quitarFoto);
    const botones = [
      { text: 'Cámara', onPress: () => lanzarPicker(true) },
      { text: 'Galería', onPress: () => lanzarPicker(false) },
    ];
    if (hayFoto) {
      botones.push({
        text: 'Quitar foto',
        style: 'destructive',
        onPress: () => {
          if (fotoNueva) setFotoNueva(null);
          else setQuitarFoto(true);
        },
      });
    }
    botones.push({ text: 'Cancelar', style: 'cancel' });
    Alert.alert('Foto del producto', undefined, botones);
  };

  const lanzarPicker = async (camara) => {
    const permiso = camara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert('Permiso necesario', camara
        ? 'Permite el uso de la cámara para tomar la foto.'
        : 'Permite el acceso a la galería para elegir una imagen.');
      return;
    }
    const opciones = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 };
    const res = camara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (!res.canceled && res.assets?.[0]?.uri) {
      setFotoNueva(res.assets[0].uri);
      setQuitarFoto(false);
    }
  };

  const eliminarCategoria = (c) => {
    Alert.alert('Eliminar categoría', `¿Eliminar "${c.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await categoriasService.remove(c.id);
            setCategorias(prev => prev.filter(x => x.id !== c.id));
            if (catFiltro === c.nombre) setCatFiltro('Todos');
          } catch {
            Alert.alert('Aviso', 'No se pudo eliminar la categoría');
          }
        },
      },
    ]);
  };

  const iniciarEdicionCategoria = cat => {
    setEditandoCatId(cat.id);
    setEditCatTexto(cat.nombre);
    setEditCatColor(cat.color || PALETA_CATEGORIAS[0]);
  };

  const guardarEdicionCategoria = async () => {
    if (!editandoCatId) return;
    const nombre = editCatTexto.trim();
    if (!nombre) return;
    try {
      const vieja = categorias.find(x => x.id === editandoCatId);
      const { data } = await categoriasService.update(editandoCatId, { nombre, color: editCatColor });
      setCategorias(prev =>
        prev.map(x => (x.id === data.id ? data : x)).sort((a, b) => a.nombre.localeCompare(b.nombre))
      );
      if (catFiltro === vieja?.nombre && vieja?.nombre !== nombre) setCatFiltro(nombre);
      setEditandoCatId(null);
    } catch (err) {
      const d = err.response?.data;
      Alert.alert('Error', d?.nombre?.[0] || d?.color?.[0] || 'No se pudo actualizar la categoría');
    }
  };

  const SelectorColores = ({ valor, onSel }) => (
    <View style={styles.colorDotsWrap}>
      {PALETA_CATEGORIAS.map(color => (
        <TouchableOpacity
          key={color}
          onPress={() => onSel(color)}
          accessibilityRole="button"
          accessibilityLabel={`Color ${color}`}
          style={[styles.colorDot, valor === color && { borderColor: c.text, borderWidth: 2 }]}
        >
          <View style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: radius.pill }]} />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Screen>
      <Header
        title="Productos"
        subtitle={`${productos.length} registrados`}
        right={
          <TouchableOpacity style={styles.catBtn} onPress={() => setCatModalVisible(true)}>
            <Ionicons name="pricetags-outline" size={20} color={c.gold} />
          </TouchableOpacity>
        }
      />

      <View style={{ paddingHorizontal: spacing.lg }}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar producto..." />
      </View>

      <View style={styles.chips}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Chip label="Todos" active={catFiltro === 'Todos'} onPress={() => setCatFiltro('Todos')} />
          {categorias.map(cat => (
            <Chip key={cat.id} label={cat.nombre} dot={cat.color} active={catFiltro === cat.nombre} onPress={() => setCatFiltro(cat.nombre)} />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={productos}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Sin productos. Toca + para registrar el primero.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => abrirEditar(item)} onLongPress={() => confirmarEliminar(item)}>
              <Card style={styles.productCard}>
                {item.imagen ? (
                  <Image
                    source={{ uri: item.imagen }}
                    style={styles.thumb}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View style={[styles.catIcon, item.categoria_color && {
                    backgroundColor: `${item.categoria_color}22`,
                    borderColor: `${item.categoria_color}55`,
                  }]}>
                    <Ionicons
                      name="wine-outline"
                      size={20}
                      color={item.categoria_color || c.goldLight}
                    />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{item.nombre}</Text>
                  <View style={styles.metaRow}>
                    <Badge label={item.categoria_nombre || 'Sin categoría'} tone="info" />
                    <Text style={[styles.stockMini, { color: (item.stock_actual ?? 0) === 0 ? c.danger : item.stock_actual <= item.stock_minimo ? c.warning : c.textMuted }]}>
                      Stock: {item.stock_actual ?? 0}
                    </Text>
                    {margenPct(item) !== null && (
                      <Text style={styles.margen}>+{margenPct(item)}%</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.price}>${Number(item.precio_venta).toFixed(2)}</Text>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}

      <FAB icon="add" onPress={abrirCrear} />

      {/* Modal categorías */}
      <Modal visible={catModalVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { justifyContent: 'flex-start', maxHeight: '60%', borderRadius: radius.xl, marginTop: 80 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Categorías</Text>
              <TouchableOpacity onPress={() => setCatModalVisible(false)}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.catInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={nuevaCat}
                onChangeText={setNuevaCat}
                placeholder="Nueva categoría"
                placeholderTextColor={c.textMuted}
                onSubmitEditing={crearCategoria}
              />
              <TouchableOpacity style={[styles.catAddBtn, { backgroundColor: c.gold }]} onPress={crearCategoria}>
                <Ionicons name="add" size={20} color={c.sobreDorado} />
              </TouchableOpacity>
            </View>

            <SelectorColores valor={colorSel} onSel={setColorSel} />

            <FlatList
              data={categorias}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) =>
                editandoCatId === item.id ? (
                  <View style={styles.catEditBox}>
                    <TextInput
                      style={styles.input}
                      value={editCatTexto}
                      onChangeText={setEditCatTexto}
                      placeholderTextColor={c.textMuted}
                      autoFocus
                      selectTextOnFocus
                      onSubmitEditing={guardarEdicionCategoria}
                    />
                    <SelectorColores valor={editCatColor} onSel={setEditCatColor} />
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity
                        style={[styles.catAddBtn, { backgroundColor: c.gold, flex: 1 }]}
                        onPress={guardarEdicionCategoria}
                        accessibilityRole="button"
                        accessibilityLabel="Guardar cambios de la categoría"
                      >
                        <Ionicons name="checkmark" size={18} color={c.sobreDorado} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.catAddBtn, { backgroundColor: c.card }]}
                        onPress={() => setEditandoCatId(null)}
                        accessibilityRole="button"
                        accessibilityLabel="Cancelar edición"
                      >
                        <Ionicons name="close" size={18} color={c.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.catRow}>
                    <View style={[styles.colorDotMini, { backgroundColor: item.color || '#C9A227' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '600' }}>{item.nombre}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12 }}>{item.total_productos} productos</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => iniciarEdicionCategoria(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar ${item.nombre}`}
                    >
                      <Ionicons name="pencil-outline" size={18} color={c.gold} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginLeft: 16 }}
                      onPress={() => eliminarCategoria(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${item.nombre}`}
                    >
                      <Ionicons name="trash-outline" size={18} color={c.danger} />
                    </TouchableOpacity>
                  </View>
                )
              }
              ListEmptyComponent={<Text style={styles.empty}>Sin categorías aún</Text>}
            />
          </View>
        </View>
      </Modal>

      {/* Modal crear/editar */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Editar producto' : 'Nuevo producto'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.fotoRow}>
                <TouchableOpacity
                  style={styles.fotoBox}
                  onPress={abrirOpcionesFoto}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir foto del producto"
                >
                  {(() => {
                    const fuente = fotoNueva || (editing?.imagen && !quitarFoto ? editing.imagen : null);
                    if (fuente) {
                      return (
                        <Image
                          source={{ uri: fuente }}
                          style={StyleSheet.absoluteFill}
                          resizeMode="cover"
                          accessibilityIgnoresInvertColors
                        />
                      );
                    }
                    return <Ionicons name="camera-outline" size={26} color={c.textMuted} />;
                  })()}
                  <View style={styles.fotoEditBadge}>
                    <Ionicons name="pencil" size={10} color={c.sobreDorado} />
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { marginTop: 0 }]}>FOTO (OPCIONAL)</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>
                    Toma una foto o elige una imagen de la galería.
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>NOMBRE</Text>
              <TextInput style={styles.input} value={form.nombre}
                onChangeText={v => setForm({ ...form, nombre: v })} placeholder="Ej. Whisky Chivas Regal"
                placeholderTextColor={c.textMuted} />

              <Text style={styles.label}>CATEGORÍA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {(categorias.length ? categorias : [{ id: null, nombre: 'Sin categorías' }]).map(cat => (
                  <Chip key={cat.id ?? 'x'} label={cat.nombre}
                    active={form.categoria === cat.id}
                    onPress={() => cat.id && setForm({ ...form, categoria: cat.id })} />
                ))}
                <Chip label="+ Nueva" active={false} onPress={() => setNuevaCatInline(true)} />
              </ScrollView>
              {nuevaCatInline && (
                <>
                  <View style={styles.catInputRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={nuevaCatTexto}
                      onChangeText={setNuevaCatTexto}
                      placeholder="Nombre de la categoría"
                      placeholderTextColor={c.textMuted}
                      autoFocus
                      onSubmitEditing={crearCategoriaInline}
                    />
                    <TouchableOpacity
                      style={[styles.catAddBtn, { backgroundColor: c.gold }]}
                      onPress={crearCategoriaInline}
                      accessibilityRole="button"
                      accessibilityLabel="Guardar categoría nueva"
                    >
                      <Ionicons name="checkmark" size={18} color={c.sobreDorado} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.catAddBtn}
                      onPress={() => { setNuevaCatInline(false); setNuevaCatTexto(''); }}
                      accessibilityRole="button"
                      accessibilityLabel="Cancelar categoría nueva"
                    >
                      <Ionicons name="close" size={18} color={c.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <SelectorColores valor={colorSel} onSel={setColorSel} />
                </>
              )}

              <Text style={styles.label}>DESCRIPCIÓN</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={form.descripcion}
                onChangeText={v => setForm({ ...form, descripcion: v })} multiline
                placeholderTextColor={c.textMuted} placeholder="Opcional" />

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>PRECIO COMPRA</Text>
                  <TextInput style={styles.input} value={form.precio_compra} keyboardType="decimal-pad"
                    onChangeText={v => setForm({ ...form, precio_compra: v })} placeholder="0.00"
                    placeholderTextColor={c.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>PRECIO VENTA *</Text>
                  <TextInput style={styles.input} value={form.precio_venta} keyboardType="decimal-pad"
                    onChangeText={v => setForm({ ...form, precio_venta: v })} placeholder="0.00"
                    placeholderTextColor={c.textMuted} />
                </View>
              </View>

              <Text style={styles.label}>UNIDAD DE MEDIDA</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
                {UNIDADES.map(u => (
                  <Chip key={u.value} label={u.label}
                    active={form.unidad === u.value}
                    onPress={() => setForm({ ...form, unidad: u.value })} />
                ))}
              </ScrollView>

              <View style={styles.row2}>
                {!editing && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>STOCK INICIAL</Text>
                    <TextInput style={styles.input} value={form.stock_inicial} keyboardType="number-pad"
                      onChangeText={v => setForm({ ...form, stock_inicial: v })}
                      placeholderTextColor={c.textMuted} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>STOCK MÍNIMO</Text>
                  <TextInput style={styles.input} value={form.stock_minimo} keyboardType="number-pad"
                    onChangeText={v => setForm({ ...form, stock_minimo: v })}
                    placeholderTextColor={c.textMuted} />
                </View>
              </View>

              {formError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={15} color={c.danger} />
                  <Text style={styles.errorText}>{formError}</Text>
                </View>
              ) : null}

              <GoldButton label={saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Registrar producto'}
                icon="checkmark" onPress={guardar} style={{ marginTop: spacing.md }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const crearEstilos = c => StyleSheet.create({
  chips: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  list: {
    padding: spacing.lg,
    paddingTop: 4,
    paddingBottom: 100,
  },
  empty: {
    color: c.textMuted,
    textAlign: 'center',
    marginTop: 40,
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
    backgroundColor: c.goldSoft,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    marginRight: 12,
    backgroundColor: c.card,
  },
  fotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  fotoBox: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fotoEditBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: c.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    borderColor: c.border,
    borderWidth: 1,
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  colorDotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
    marginTop: 2,
  },
  catEditBox: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
    gap: 8,
  },
  colorDotMini: {
    width: 12,
    height: 12,
    borderRadius: radius.pill,
    marginRight: 10,
  },
  name: {
    ...type.body,
    color: c.text,
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
  margen: {
    fontSize: 11,
    fontWeight: '800',
    color: c.success,
    backgroundColor: c.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  price: {
    color: c.goldLight,
    fontSize: 17,
    fontWeight: '800',
    marginLeft: 10,
  },
  catBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  catAddBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: c.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,12,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...type.h2,
    color: c.text,
  },
  label: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.2,
    marginBottom: 6,
    marginTop: 10,
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
  row2: {
    flexDirection: 'row',
    gap: 12,
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
});
