import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { GoldButton } from '../components/ui';
import { authService } from '../services/api';

const ROLES = [
  { value: 'VENDEDOR', label: 'Vendedor', icon: 'cart-outline', desc: 'Vende y consulta inventario' },
  { value: 'ADMIN', label: 'Administrador', icon: 'shield-outline', desc: 'Control total del negocio' },
];

export default function RegistroScreen({ navigation }) {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    rol: 'VENDEDOR',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const validar = () => {
    if (!form.first_name.trim() || !form.last_name.trim()) return 'Ingresa tu nombre y apellido.';
    if (!form.email.trim()) return 'Ingresa tu correo electrónico.';
    if (!form.username.trim()) return 'Elige un nombre de usuario.';
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (form.password !== form.password2) return 'Las contraseñas no coinciden.';
    return null;
  };

  const handleRegistro = async () => {
    const fallo = validar();
    if (fallo) {
      setError(fallo);
      return;
    }
    try {
      setLoading(true);
      setError('');
      await authService.register({
        ...form,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
      });
      // Registro exitoso: inicia sesión automáticamente.
      await authService.login(form.username.trim(), form.password.trim());
      navigation.replace('MainApp');
    } catch (err) {
      const d = err.response?.data;
      let msg = 'No se pudo completar el registro';
      if (typeof d === 'object' && d) {
        msg = Object.entries(d)
          .map(([k, v]) => `${k === 'password2' ? 'confirmación' : k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('\n');
      } else if (err.message === 'Network Error') {
        msg = 'No se pudo conectar con el servidor';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={c.gradients.dark} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Encabezado */}
          <View style={styles.head}>
            <LinearGradient
              colors={c.gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="person-add" size={28} color={c.sobreDorado} />
            </LinearGradient>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Empieza a gestionar tu licorería</Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={[styles.inputWrap, styles.half]}>
                <Ionicons name="person-outline" size={17} color={c.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre"
                  placeholderTextColor={c.textMuted}
                  value={form.first_name}
                  onChangeText={v => set('first_name', v)}
                  accessibilityLabel="Campo de nombre"
                  returnKeyType="next"
                />
              </View>
              <View style={[styles.inputWrap, styles.half]}>
                <Ionicons name="person-outline" size={17} color={c.textMuted} />
                <TextInput
                  style={styles.input}
                  placeholder="Apellido"
                  placeholderTextColor={c.textMuted}
                  value={form.last_name}
                  onChangeText={v => set('last_name', v)}
                  accessibilityLabel="Campo de apellido"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={17} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={c.textMuted}
                value={form.email}
                onChangeText={v => set('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Campo de correo electrónico"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="at-outline" size={17} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor={c.textMuted}
                value={form.username}
                onChangeText={v => set('username', v)}
                autoCapitalize="none"
                autoComplete="username"
                accessibilityLabel="Campo de nombre de usuario"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={17} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña (mínimo 8 caracteres)"
                placeholderTextColor={c.textMuted}
                value={form.password}
                onChangeText={v => set('password', v)}
                secureTextEntry={!showPass}
                autoComplete="new-password"
                textContentType="newPassword"
                passwordRules="minlength: 8;"
                accessibilityLabel="Campo de contraseña"
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={c.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="checkmark-circle-outline" size={17} color={c.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Confirmar contraseña"
                placeholderTextColor={c.textMuted}
                value={form.password2}
                onChangeText={v => set('password2', v)}
                secureTextEntry={!showPass}
                autoComplete="new-password"
                accessibilityLabel="Campo de confirmación de contraseña"
                returnKeyType="done"
                onSubmitEditing={handleRegistro}
              />
            </View>

            {/* Rol */}
            <Text style={styles.label}>TIPO DE CUENTA</Text>
            <View style={styles.rolesRow}>
              {ROLES.map(r => (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.rolCard, form.rol === r.value && styles.rolActive]}
                  onPress={() => set('rol', r.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: form.rol === r.value }}
                  accessibilityLabel={`Tipo de cuenta ${r.label}`}
                >
                  <Ionicons
                    name={r.icon}
                    size={18}
                    color={form.rol === r.value ? c.sobreDorado : c.goldLight}
                  />
                  <Text style={[styles.rolLabel, form.rol === r.value && styles.rolLabelActive]}>
                    {r.label}
                  </Text>
                  <Text style={[styles.rolDesc, form.rol === r.value && styles.rolDescActive]} numberOfLines={2}>
                    {r.desc}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {error ? (
              <View
                style={styles.errorBox}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <Ionicons name="alert-circle" size={15} color={c.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={styles.loadingBtn}>
                <ActivityIndicator color={c.gold} />
              </View>
            ) : (
              <GoldButton label="Crear cuenta" icon="checkmark" onPress={handleRegistro} style={{ marginTop: spacing.md }} />
            )}
          </View>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.loginLink}
            accessibilityRole="link"
            accessibilityLabel="Ya tengo cuenta, ir a iniciar sesión"
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? <Text style={styles.loginLinkGold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const crearEstilos = c => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
    paddingVertical: 50,
  },
  head: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    ...c.shadow.gold,
  },
  title: {
    ...type.h1,
    color: c.text,
  },
  subtitle: {
    ...type.small,
    color: c.textSecondary,
    marginTop: 4,
  },
  form: {
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...c.shadow.card,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
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
    marginBottom: 12,
  },
  input: {
    flex: 1,
    color: c.text,
    fontSize: 15,
    marginLeft: 10,
  },
  label: {
    ...type.micro,
    color: c.textSecondary,
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 6,
  },
  rolesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rolCard: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 44,
  },
  rolActive: {
    borderColor: c.gold,
    backgroundColor: c.goldSoft,
  },
  rolLabel: {
    color: c.text,
    fontWeight: '800',
    fontSize: 13,
    marginTop: 7,
  },
  rolLabelActive: {
    color: c.goldLight,
  },
  rolDesc: {
    color: c.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  rolDescActive: {
    color: c.textSecondary,
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
    marginTop: 6,
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
  loginLink: {
    alignSelf: 'center',
    marginTop: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  loginLinkText: {
    color: c.textSecondary,
    fontSize: 14,
  },
  loginLinkGold: {
    color: c.goldLight,
    fontWeight: '800',
  },
});
