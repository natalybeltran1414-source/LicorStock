import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, Image, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { Screen, Header, Card } from '../components/ui';
import { authService, getSession } from '../services/api';
import * as biometria from '../services/biometria';
import * as acceso from '../services/acceso';

const VERSION_APP = '1.0.0';

export default function PerfilScreen({ navigation }) {
  const { paleta: c, modo, setModo } = useTema();
  const styles = crearEstilos(c);
  const [usuario, setUsuario] = useState(null);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  // editar perfil
  const [editarVisible, setEditarVisible] = useState(false);
  const [perfil, setPerfil] = useState({ first_name: '', last_name: '', email: '' });
  const [perfilError, setPerfilError] = useState('');

  // cambiar contraseña
  const [passVisible, setPassVisible] = useState(false);
  const [claves, setClaves] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passError, setPassError] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);

  // acerca de
  const [acercaVisible, setAcercaVisible] = useState(false);

  // biometría
  const [bioActivada, setBioActivada] = useState(false);
  const [bioDisponible, setBioDisponible] = useState(false);
  const [bioTipo, setBioTipo] = useState({ label: 'Huella digital', icono: 'finger-print' });

  // PIN
  const [tienePin, setTienePin] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [pinNuevo, setPinNuevo] = useState('');
  const [pinConfirmar, setPinConfirmar] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const u = await authService.me();
        setUsuario(u);
      } catch {
        try {
          const { user } = await getSession();
          setUsuario(user);
        } catch {
          // sin datos
        }
      }
      const disp = await biometria.hardwareDisponible();
      setBioDisponible(disp);
      setBioTipo(await biometria.tipoBiometria());
      setBioActivada(await biometria.estaActivada());
      setTienePin(await acceso.tienePin());
    })();
  }, []);

  const alternarBiometria = async () => {
    if (bioActivada) {
      await biometria.desactivar();
      setBioActivada(false);
      return;
    }
    if (!bioDisponible) {
      Alert.alert(
        'No disponible',
        'Este dispositivo no tiene huella o rostro configurado. Actívalo en los ajustes de seguridad del teléfono.',
      );
      return;
    }
    const ok = await biometria.verificar(`Registra tu ${bioTipo.label.toLowerCase()} para acceder más rápido`);
    if (ok) {
      await biometria.activar();
      setBioActivada(true);
      Alert.alert('Listo', `La próxima vez podrás entrar con tu ${bioTipo.label.toLowerCase()}.`);
    } else {
      Alert.alert('No se pudo verificar', 'No se activó el acceso biométrico. Inténtalo de nuevo.');
    }
  };

  const abrirEditar = () => {
    setPerfil({
      first_name: usuario?.first_name || '',
      last_name: usuario?.last_name || '',
      email: usuario?.email || '',
    });
    setPerfilError('');
    setEditarVisible(true);
  };

  const guardarPerfil = async () => {
    if (!perfil.first_name.trim() || !perfil.last_name.trim()) {
      setPerfilError('El nombre y apellido son obligatorios.');
      return;
    }
    if (perfil.email && !/^\S+@\S+\.\S+$/.test(perfil.email)) {
      setPerfilError('Ingresa un correo válido.');
      return;
    }
    try {
      setGuardandoPerfil(true);
      setPerfilError('');
      const u = await authService.updatePerfil({
        first_name: perfil.first_name.trim(),
        last_name: perfil.last_name.trim(),
        email: perfil.email.trim().toLowerCase(),
      });
      setUsuario(u);
      setEditarVisible(false);
    } catch (err) {
      const d = err.response?.data;
      setPerfilError(
        typeof d === 'object' && d
          ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
          : 'No se pudo actualizar el perfil',
      );
    } finally {
      setGuardandoPerfil(false);
    }
  };

  const cambiarPassword = async () => {
    if (!claves.actual || !claves.nueva || !claves.confirmar) {
      setPassError('Completa los tres campos.');
      return;
    }
    if (claves.nueva.length < 8) {
      setPassError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (claves.nueva !== claves.confirmar) {
      setPassError('Las contraseñas no coinciden.');
      return;
    }
    try {
      setCambiandoPass(true);
      setPassError('');
      await authService.cambiarPassword({
        password_actual: claves.actual,
        nueva_password: claves.nueva,
        confirmar_password: claves.confirmar,
      });
      setPassVisible(false);
      setClaves({ actual: '', nueva: '', confirmar: '' });
      Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
    } catch (err) {
      const d = err.response?.data;
      setPassError(
        typeof d === 'object' && d
          ? Object.entries(d).map(([k, v]) => `${k === 'password_actual' ? 'contraseña actual' : k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
          : 'No se pudo cambiar la contraseña',
      );
    } finally {
      setCambiandoPass(false);
    }
  };

  const abrirPinModal = () => {
    setPinNuevo('');
    setPinConfirmar('');
    setPinError('');
    setPinModal(true);
  };

  const guardarPin = async () => {
    if (pinNuevo.length < 4 || pinNuevo.length > 6 || !/^\d+$/.test(pinNuevo)) {
      setPinError('El PIN debe tener entre 4 y 6 dígitos numéricos.');
      return;
    }
    if (pinNuevo !== pinConfirmar) {
      setPinError('Los PIN no coinciden.');
      return;
    }
    await acceso.guardarPin(pinNuevo);
    setTienePin(true);
    setPinModal(false);
    Alert.alert('Listo', 'Tu PIN de acceso rápido se guardó correctamente.');
  };

  const quitarPin = () => {
    Alert.alert('Quitar PIN', '¿Seguro que deseas eliminar tu PIN de acceso rápido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await acceso.quitarPin();
          setTienePin(false);
        },
      },
    ]);
  };

  const confirmarSalir = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await biometria.desactivar();
          await authService.logout();
          navigation.replace('Login');
        },
      },
    ]);
  };

  const iniciales = ((usuario?.first_name?.[0] || '') + (usuario?.last_name?.[0] || usuario?.username?.[0] || '?')).toUpperCase();

  return (
    <Screen>
      <Header title="Mi perfil" subtitle="Cuenta y ajustes" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de usuario */}
        <Card glow style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </View>
          <Text style={styles.userName}>
            {usuario?.nombre_completo || usuario?.username || 'Usuario'}
          </Text>
          <Text style={styles.userEmail}>{usuario?.email || 'Sin correo'}</Text>
          {usuario?.rol && (
            <View
              style={[styles.rolBadge, usuario.rol === 'ADMIN' ? styles.rolAdmin : styles.rolVendedor]}
              accessibilityLabel={`Rol: ${usuario.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}`}
            >
              <Ionicons
                name={usuario.rol === 'ADMIN' ? 'shield-checkmark' : 'cart'}
                size={12}
                color={usuario.rol === 'ADMIN' ? c.goldLight : c.success}
              />
              <Text style={[styles.rolText, usuario.rol === 'ADMIN' ? { color: c.goldLight } : { color: c.success }]}>
                {usuario.rol === 'ADMIN' ? 'Administrador' : 'Vendedor'}
              </Text>
            </View>
          )}
        </Card>

        {/* Opciones */}
        <Text style={styles.sectionTitle}>CUENTA</Text>
        <Card style={styles.optionsCard}>
          <OptionRow
            icon="person-circle-outline"
            label="Editar perfil"
            sub="Nombre, apellido y correo"
            onPress={abrirEditar}
          />
          <Divider />
          <OptionRow
            icon="lock-closed-outline"
            label="Cambiar contraseña"
            sub="Actualiza tu clave de acceso"
            onPress={() => { setPassError(''); setPassVisible(true); }}
          />
        </Card>

        <Text style={styles.sectionTitle}>APLICACIÓN</Text>
        <Card style={styles.optionsCard}>
          <OptionRow
            icon="information-circle-outline"
            label="Acerca de LicorStock"
            sub={`Versión ${VERSION_APP}`}
            onPress={() => setAcercaVisible(true)}
          />
        </Card>

        <Text style={styles.sectionTitle}>APARIENCIA</Text>
        <Card style={styles.optionsCard}>
          <View style={styles.temaRow} accessibilityRole="radiogroup" accessibilityLabel="Tema de la aplicación">
            {[
              { valor: 'claro', etiqueta: 'Claro', icono: 'sunny-outline' },
              { valor: 'oscuro', etiqueta: 'Oscuro', icono: 'moon-outline' },
            ].map(op => {
              const activo = modo === op.valor;
              return (
                <TouchableOpacity
                  key={op.valor}
                  style={[styles.temaBtn, activo && styles.temaBtnActive]}
                  onPress={() => setModo(op.valor)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activo }}
                  accessibilityLabel={`Tema ${op.etiqueta}`}
                >
                  <Ionicons
                    name={op.icono}
                    size={17}
                    color={activo ? c.goldLight : c.textMuted}
                  />
                  <Text style={[styles.temaText, activo && styles.temaTextActive]}>{op.etiqueta}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Text style={styles.sectionTitle}>SEGURIDAD</Text>
        <Card style={styles.optionsCard}>
          <View style={styles.switchRow}>
            <View style={styles.optionIcon}>
              <Ionicons name={bioTipo.icono} size={18} color={c.goldLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Acceso con {bioTipo.label.toLowerCase()}</Text>
              <Text style={styles.optionSub}>
                {!bioDisponible
                  ? 'No disponible en este dispositivo'
                  : bioActivada
                    ? 'Activada — entra sin escribir tu contraseña'
                    : `Al activar se te pedirá tu ${bioTipo.label.toLowerCase()}`}
              </Text>
            </View>
            <Switch
              value={bioActivada}
              onValueChange={alternarBiometria}
              trackColor={{ false: c.borderSubtle, true: c.goldSoft }}
              thumbColor={bioActivada ? c.gold : c.textMuted}
              disabled={!bioDisponible && !bioActivada}
              accessibilityLabel={`Acceso con ${bioTipo.label.toLowerCase()}`}
            />
          </View>
          <Divider />
          <OptionRow
            icon="keypad-outline"
            label={tienePin ? 'Cambiar PIN de acceso' : 'Crear PIN de acceso'}
            sub={tienePin ? 'Modifica tu código numérico' : 'Ingresa más rápido con un PIN de 4-6 dígitos'}
            onPress={abrirPinModal}
          />
          {tienePin && (
            <>
              <Divider />
              <OptionRow
                icon="trash-outline"
                label="Quitar PIN"
                sub="Deja de usar el acceso con PIN"
                onPress={quitarPin}
              />
            </>
          )}
        </Card>

        {/* Salir */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={confirmarSalir}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={19} color={c.danger} />
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>LicorStock v{VERSION_APP} · Gestión de licorería</Text>
      </ScrollView>

      {/* Modal editar perfil */}
      <Modal visible={editarVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar perfil</Text>

            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              value={perfil.first_name}
              onChangeText={v => setPerfil({ ...perfil, first_name: v })}
              placeholder="Nombre"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de nombre"
            />

            <Text style={styles.label}>APELLIDO</Text>
            <TextInput
              style={styles.input}
              value={perfil.last_name}
              onChangeText={v => setPerfil({ ...perfil, last_name: v })}
              placeholder="Apellido"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de apellido"
            />

            <Text style={styles.label}>CORREO</Text>
            <TextInput
              style={styles.input}
              value={perfil.email}
              onChangeText={v => setPerfil({ ...perfil, email: v })}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="correo@ejemplo.com"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de correo electrónico"
            />

            {perfilError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{perfilError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditarVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, guardandoPerfil && { opacity: 0.6 }]}
                onPress={guardarPerfil}
                disabled={guardandoPerfil}
              >
                {guardandoPerfil
                  ? <ActivityIndicator size="small" color="#1A1408" />
                  : <Text style={styles.confirmText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal cambiar contraseña */}
      <Modal visible={passVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar contraseña</Text>

            <Text style={styles.label}>CONTRASEÑA ACTUAL</Text>
            <TextInput
              style={styles.input}
              value={claves.actual}
              onChangeText={v => setClaves({ ...claves, actual: v })}
              secureTextEntry
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de contraseña actual"
            />

            <Text style={styles.label}>NUEVA CONTRASEÑA (MÍNIMO 8)</Text>
            <TextInput
              style={styles.input}
              value={claves.nueva}
              onChangeText={v => setClaves({ ...claves, nueva: v })}
              secureTextEntry
              autoComplete="new-password"
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de nueva contraseña"
            />

            <Text style={styles.label}>CONFIRMAR NUEVA CONTRASEÑA</Text>
            <TextInput
              style={styles.input}
              value={claves.confirmar}
              onChangeText={v => setClaves({ ...claves, confirmar: v })}
              secureTextEntry
              autoComplete="new-password"
              placeholder="••••••••"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de confirmación de contraseña"
            />

            {passError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{passError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPassVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, cambiandoPass && { opacity: 0.6 }]}
                onPress={cambiarPassword}
                disabled={cambiandoPass}
              >
                {cambiandoPass
                  ? <ActivityIndicator size="small" color="#1A1408" />
                  : <Text style={styles.confirmText}>Actualizar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal PIN */}
      <Modal visible={pinModal} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{tienePin ? 'Cambiar PIN' : 'Crear PIN'}</Text>
            <Text style={styles.pinModalHint}>Usa entre 4 y 6 dígitos numéricos.</Text>

            <Text style={styles.label}>NUEVO PIN</Text>
            <TextInput
              style={styles.input}
              value={pinNuevo}
              onChangeText={v => setPinNuevo(v.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de nuevo PIN"
            />

            <Text style={styles.label}>CONFIRMAR PIN</Text>
            <TextInput
              style={styles.input}
              value={pinConfirmar}
              onChangeText={v => setPinConfirmar(v.replace(/[^0-9]/g, '').slice(0, 6))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              placeholder="••••"
              placeholderTextColor={c.textMuted}
              accessibilityLabel="Campo de confirmación de PIN"
            />

            {pinError ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{pinError}</Text>
              </View>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPinModal(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={guardarPin}>
                <Text style={styles.confirmText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal acerca de */}
      <Modal visible={acercaVisible} animationType="fade" transparent>
        <View style={styles.overlay}>
          <View style={[styles.modalCard, { alignItems: 'center' }]}>
            <LinearFallback />
            <Text style={styles.modalTitle}>LicorStock</Text>
            <Text style={styles.aboutText}>
              Sistema de gestión para licorerías: inventario, ventas, clientes y cuentas por cobrar.
            </Text>
            <Text style={styles.aboutVersion}>Versión {VERSION_APP}</Text>
            <TouchableOpacity style={styles.okBtn} onPress={() => setAcercaVisible(false)}>
              <Text style={styles.okText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function LinearFallback() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  return (
    <Image
      source={require('../../assets/logo.png')}
      style={styles.aboutLogo}
      resizeMode="cover"
      accessibilityIgnoresInvertColors
    />
  );
}

function OptionRow({ icon, label, sub, onPress }) {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  return (
    <TouchableOpacity
      style={styles.optionRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sub || ''}`}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={18} color={c.goldLight} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionLabel}>{label}</Text>
        {sub ? <Text style={styles.optionSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={17} color={c.textMuted} />
    </TouchableOpacity>
  );
}

function Divider() {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  return <View style={styles.divider} />;
}

const crearEstilos = c => StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 40,
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: 26,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: c.goldSoft,
    borderWidth: 2,
    borderColor: c.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 28,
    letterSpacing: 1,
  },
  userName: {
    ...type.h2,
    color: c.text,
  },
  userEmail: {
    ...type.small,
    color: c.textSecondary,
    marginTop: 4,
  },
  rolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  rolAdmin: {
    backgroundColor: c.goldSoft,
  },
  rolVendedor: {
    backgroundColor: c.successSoft,
  },
  rolText: {
    fontWeight: '800',
    fontSize: 12,
  },
  sectionTitle: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  temaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  temaBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    backgroundColor: c.surface,
    gap: 5,
  },
  temaBtnActive: {
    backgroundColor: c.goldSoft,
    borderColor: c.gold,
  },
  temaText: {
    color: c.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  temaTextActive: {
    color: c.goldLight,
  },
  optionsCard: {
    paddingVertical: 4,
    marginBottom: spacing.lg,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    minHeight: 56,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    minHeight: 56,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: c.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionLabel: {
    ...type.body,
    color: c.text,
    fontWeight: '700',
  },
  optionSub: {
    color: c.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: c.borderSubtle,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.35)',
    backgroundColor: c.dangerSoft,
    borderRadius: radius.md,
    paddingVertical: 14,
    minHeight: 48,
  },
  logoutText: {
    color: c.danger,
    fontWeight: '800',
    fontSize: 15,
  },
  footer: {
    textAlign: 'center',
    color: c.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 24,
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
  modalTitle: {
    ...type.h2,
    color: c.text,
    marginBottom: 6,
  },
  pinModalHint: {
    color: c.textSecondary,
    fontSize: 13,
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
    justifyContent: 'center',
    paddingVertical: 13,
    minHeight: 48,
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
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: c.gold,
  },
  confirmText: {
    color: '#1A1408',
    fontWeight: '800',
  },
  aboutLogo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    marginBottom: 12,
  },
  aboutText: {
    color: c.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  aboutVersion: {
    color: c.goldLight,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 10,
  },
  okBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    minHeight: 46,
    marginTop: 18,
  },
  okText: {
    color: '#1A1408',
    fontWeight: '800',
  },
});
