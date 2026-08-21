import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, gradients, radius, type, shadow, spacing } from '../theme/colors';
import { GoldButton } from '../components/ui';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (email && password) {
      navigation.replace('MainApp');
    } else {
      Alert.alert('Error', 'Por favor ingresa tus credenciales');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.dark} style={StyleSheet.absoluteFill} />
      <View style={styles.glowTop} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoWrap}>
            <LinearGradient
              colors={gradients.gold}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoCircle}
            >
              <Ionicons name="wine" size={34} color="#1A1408" />
            </LinearGradient>
            <Text style={styles.brand}>LicorStock</Text>
            <View style={styles.brandRule} />
            <Text style={styles.tagline}>GESTIÓN INTELIGENTE DE LICORERÍA</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <GoldButton label="Ingresar" icon="arrow-forward" onPress={handleLogin} style={{ marginTop: spacing.md }} />

            <TouchableOpacity style={styles.forgot}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.version}>LicorStock v1.0</Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 44,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    ...shadow.gold,
  },
  brand: {
    ...type.display,
    color: colors.goldLight,
    fontStyle: 'italic',
  },
  brandRule: {
    width: 46,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginVertical: 12,
  },
  tagline: {
    ...type.micro,
    color: colors.textSecondary,
    letterSpacing: 2.5,
  },
  form: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadow.card,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    marginLeft: 10,
  },
  forgot: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  version: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 30,
  },
});
