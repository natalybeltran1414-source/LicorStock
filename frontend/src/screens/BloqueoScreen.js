import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { radius, type, spacing } from '../theme/colors';
import { useTema } from '../theme/ThemeContext';
import { verificar, tipoBiometria, hardwareDisponible } from '../services/biometria';
import { marcarActividad } from '../services/api';

export default function BloqueoScreen({ navigation }) {
  const { paleta: c } = useTema();
  const styles = crearEstilos(c);
  const [estado, setEstado] = useState('cargando'); // cargando | esperando | error | sin-soporte
  const [biometria, setBiometria] = useState({ label: 'Huella digital', icono: 'finger-print' });

  useEffect(() => {
    tipoBiometria().then(setBiometria);
  }, []);

  const intentar = useCallback(async () => {
    setEstado('cargando');
    const disponible = await hardwareDisponible();
    if (!disponible) {
      setEstado('sin-soporte');
      return;
    }
    const ok = await verificar('Autentícate para acceder a LicorStock');
    if (ok) {
      marcarActividad();
      navigation.replace('MainApp');
    } else {
      setEstado('error');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(intentar, 400);
      return () => clearTimeout(t);
    }, [intentar]),
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={c.gradients.dark} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.replace('Login')}
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio de sesión con contraseña"
      >
        <Ionicons name="chevron-back" size={24} color={c.gold} />
      </TouchableOpacity>

      <View style={styles.center}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImg}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <Text style={styles.brand}>LicorStock</Text>

        <View
          style={[styles.iconWrap, estado === 'error' && styles.iconError]}
          accessible
          accessibilityLabel={
            estado === 'error'
              ? 'Autenticación fallida. Puedes intentarlo de nuevo.'
              : `Esperando ${biometria.label}`
          }
        >
          {estado === 'cargando' ? (
            <ActivityIndicator size="large" color={c.gold} />
          ) : (
            <Ionicons
              name={estado === 'sin-soporte' ? 'alert-circle-outline' : biometria.icono}
              size={72}
              color={estado === 'error' ? c.danger : c.goldLight}
            />
          )}
        </View>

        {estado === 'sin-soporte' ? (
          <>
            <Text style={styles.title}>Biometría no disponible</Text>
            <Text style={styles.subtitle}>
              Configura tu huella o rostro en los ajustes del dispositivo o ingresa con tu contraseña.
            </Text>
          </>
        ) : estado === 'error' ? (
          <>
            <Text style={styles.title}>No se pudo autenticar</Text>
            <Text style={styles.subtitle}>Inténtalo de nuevo o usa tu contraseña.</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Coloca tu {biometria.label.toLowerCase()}</Text>
            <Text style={styles.subtitle}>para iniciar sesión</Text>
          </>
        )}

        {(estado === 'error' || estado === 'sin-soporte') && (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={intentar}
            disabled={estado === 'cargando'}
            accessibilityRole="button"
            accessibilityLabel="Intentar autenticación de nuevo"
          >
            <Ionicons name="finger-print" size={17} color={c.sobreDorado} />
            <Text style={styles.retryText}>Intentar de nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={styles.passLink}
        onPress={() => navigation.replace('Login')}
        accessibilityRole="link"
        accessibilityLabel="Usar contraseña en su lugar"
      >
        <Ionicons name="lock-closed-outline" size={15} color={c.textSecondary} />
        <Text style={styles.passText}>Usar contraseña</Text>
      </TouchableOpacity>
    </View>
  );
}

const crearEstilos = c => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: c.background,
  },
  glow: {
    position: 'absolute',
    top: -120,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logoImg: {
    width: 120,
    height: 120,
    borderRadius: 28,
    marginBottom: 12,
    ...c.shadow.card,
  },
  brand: {
    ...type.h1,
    color: c.goldLight,
    fontStyle: 'italic',
    marginBottom: 36,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: c.card,
    borderWidth: 2,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  iconError: {
    borderColor: 'rgba(255,107,107,0.4)',
    backgroundColor: c.dangerSoft,
  },
  title: {
    ...type.h2,
    color: c.text,
    textAlign: 'center',
  },
  subtitle: {
    color: c.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: c.gold,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 22,
    minHeight: 46,
    marginTop: 26,
  },
  retryText: {
    color: c.sobreDorado,
    fontWeight: '800',
    fontSize: 14,
  },
  passLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 44,
  },
  passText: {
    color: c.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
