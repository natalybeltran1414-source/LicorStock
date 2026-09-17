import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { PALETAS } from '../theme/paletas';
import { GoldButton } from '../components/ui';
import { authService, getSession } from '../services/api';
import * as biometria from '../services/biometria';
import * as acceso from '../services/acceso';

export default function LoginScreen({ navigation }) {
  const c = PALETAS.oscuro;
  const styles = crearEstilos(c);
  const teclado = crearTeclado(c);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [metodos, setMetodos] = useState({ pin: false, biometria: false });
  const [bioTipo, setBioTipo] = useState({ label: 'Huella digital', icono: 'finger-print' });

  const [pinSheet, setPinSheet] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);

  useEffect(() => {
    (async () => {
      const [hayPin, bioDisp, tipo] = await Promise.all([
        acceso.tienePin(),
        biometria.hardwareDisponible(),
        biometria.tipoBiometria(),
      ]);
      setMetodos({ pin: hayPin, biometria: bioDisp });
      setBioTipo(tipo);
    })();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await authService.login(email.trim(), password);
      navigation.replace('MainApp');
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        (Array.isArray(data?.non_field_errors) ? data.non_field_errors[0] : null) ||
        (err.code === 'ECONNABORTED' ? 'Tiempo de espera agotado' : null) ||
        (err.message === 'Network Error'
          ? 'No se pudo conectar con el servidor'
          : 'Credenciales inválidas.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const recuperarContrasena = () => {
    Alert.alert(
      'Recuperar contraseña',
      'Por seguridad, solicita al administrador del sistema el restablecimiento de tu contraseña.',
      [{ text: 'Entendido' }],
    );
  };

  const cerrarPinSheet = () => {
    setPinSheet(false);
    setPin('');
    setPinError(false);
  };

  const entrarConPin = async (codigoIngresado) => {
    const ok = await acceso.verificarPin(codigoIngresado);
    if (!ok) {
      setPinError(true);
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 600);
      return;
    }
    const { access } = await getSession();
    if (!access) {
      cerrarPinSheet();
      setError('Tu sesión expiró. Ingresa con tu correo y contraseña.');
      return;
    }
    navigation.replace('MainApp');
  };

  const teclar = (digito) => {
    if (pin.length >= 6 || pinError) return;
    const nuevo = pin + digito;
    setPin(nuevo);
    if (nuevo.length >= 4) entrarConPin(nuevo);
  };

  const abrirBiometria = async () => {
    const ok = await biometria.verificar(`Autentícate con tu ${bioTipo.label.toLowerCase()} para acceder a LicorStock`);
    if (!ok) return;
    const { access } = await getSession();
    if (!access) {
      setError('Tu sesión expiró. Ingresa con tu correo y contraseña.');
      return;
    }
    navigation.replace('MainApp');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={c.gradients.dark} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
          {/* Encabezado */}
          <View style={styles.logoWrap}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImg}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.brand}>LicorStock</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>GESTIÓN INTELIGENTE DE LICORERÍA</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={c.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Campo de correo electrónico"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={c.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                autoComplete="current-password"
                textContentType="password"
                accessibilityLabel="Campo de contraseña"
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={styles.errorBox} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={c.gold} />
              </View>
            ) : (
              <GoldButton label="Ingresar" icon="arrow-forward" onPress={handleLogin} paleta={PALETAS.oscuro} style={{ marginTop: spacing.md }} />
            )}

            <TouchableOpacity
              onPress={recuperarContrasena}
              accessibilityRole="link"
              accessibilityLabel="Recuperar contraseña"
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Atajos de acceso */}
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o ingresa con</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={styles.shortcutBtn}
                onPress={() => {
                  if (metodos.pin) {
                    setPinSheet(true);
                  } else {
                    Alert.alert(
                      'Sin PIN configurado',
                      'Crea tu PIN en Perfil → Seguridad para ingresar más rápido.',
                      [{ text: 'Entendido' }],
                    );
                  }
                }}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Ingresar con PIN"
              >
                <Ionicons name="keypad" size={26} color={c.goldLight} />
              </TouchableOpacity>
              {metodos.biometria && (
                <TouchableOpacity
                  style={styles.shortcutBtn}
                  onPress={abrirBiometria}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Ingresar con ${bioTipo.label.toLowerCase()}`}
                >
                  <Ionicons name={bioTipo.icono} size={28} color={c.goldLight} />
                </TouchableOpacity>
              )}
            </View>
          </>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Registro')}
              accessibilityRole="link"
              accessibilityLabel="Ir a la pantalla de registro"
            >
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>LicorStock v1.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom sheet PIN */}
      <Modal visible={pinSheet} animationType="slide" transparent onRequestClose={cerrarPinSheet}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={cerrarPinSheet} accessibilityLabel="Cerrar teclado PIN" />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Ingresa tu PIN</Text>
              <TouchableOpacity
                onPress={cerrarPinSheet}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Ionicons name="close" size={22} color={c.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.pinDots} accessible accessibilityLabel={`Dígitos ingresados: ${pin.length}`}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled, pinError && styles.dotError]} />
              ))}
            </View>

            <Text style={styles.pinHint} accessibilityLiveRegion="assertive">
              {pinError ? 'PIN incorrecto' : 'Código de 4 a 6 dígitos'}
            </Text>

            <View style={styles.keypad}>
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                <KeypadKey key={d} label={d} onPress={() => teclar(d)} />
              ))}
              <View style={teclado.keyGhost} />
              <KeypadKey label="0" onPress={() => teclar('0')} />
              <TouchableOpacity
                style={teclado.key}
                onPress={() => setPin(actual => actual.slice(0, -1))}
                accessibilityRole="button"
                accessibilityLabel="Borrar último dígito"
              >
                <Ionicons name="backspace-outline" size={24} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function KeypadKey({ label, onPress }) {
  const c = PALETAS.oscuro;
  const teclado = crearTeclado(c);
  return (
    <TouchableOpacity
      style={teclado.key}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={`Número ${label}`}
    >
      <Text style={teclado.keyText}>{label}</Text>
    </TouchableOpacity>
  );
}

const crearTeclado = c => StyleSheet.create({
  key: {
    width: 72,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyGhost: {
    width: 72,
    height: 60,
  },
  keyText: {
    color: c.text,
    fontSize: 23,
    fontWeight: '700',
  },
});

const crearEstilos = c => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: { flex: 1 },
  glowTop: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: '12%',
    paddingBottom: 24,
    padding: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 34,
  },
  logoImg: {
    width: 130,
    height: 130,
    borderRadius: 30,
    marginBottom: 12,
    ...c.shadow.card,
  },
  brand: {
    ...type.display,
    color: c.goldLight,
    fontStyle: 'italic',
  },
  brandRule: {
    width: 46,
    height: 2,
    borderRadius: 2,
    backgroundColor: c.gold,
    marginVertical: 12,
  },
  tagline: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 2.5,
  },
  form: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...c.shadow.card,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: c.text,
    fontSize: 15,
    marginLeft: 10,
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
    marginTop: 4,
  },
  errorText: {
    color: c.danger,
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  loadingBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  forgotText: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 13,
    marginTop: 16,
    textDecorationLine: 'underline',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.borderSubtle,
  },
  dividerText: {
    color: c.textMuted,
    fontSize: 12,
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
  },
  shortcutBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: c.card,
    borderWidth: 1.5,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...c.shadow.card,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 26,
  },
  registerText: {
    color: c.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: c.goldLight,
    fontSize: 14,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  version: {
    textAlign: 'center',
    color: c.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 24,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(5,7,12,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: c.border,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 30,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderSubtle,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    ...type.h2,
    color: c.text,
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 22,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: c.border,
    backgroundColor: c.background,
  },
  dotFilled: {
    backgroundColor: c.gold,
    borderColor: c.gold,
  },
  dotError: {
    backgroundColor: c.danger,
    borderColor: c.danger,
  },
  pinHint: {
    color: c.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 14,
    minHeight: 18,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 14,
    marginTop: 18,
  },
});
