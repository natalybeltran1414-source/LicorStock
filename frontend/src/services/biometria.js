import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FLAG_KEY = 'biometric_enabled';

export async function hardwareDisponible() {
  try {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return has && enrolled;
  } catch {
    return false;
  }
}

export async function tipoBiometria() {
  try {
    const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (tipos.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return { label: 'Reconocimiento facial', icono: 'scan-face' };
    }
    if (tipos.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return { label: 'Huella digital', icono: 'finger-print' };
    }
    if (tipos.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { label: 'Reconocimiento de iris', icono: 'eye' };
    }
  } catch {
    // sin soporte
  }
  return { label: 'Biometría', icono: 'finger-print' };
}

export async function verificar(motivo) {
  try {
    const resultado = await LocalAuthentication.authenticateAsync({
      promptMessage: motivo,
      cancelLabel: 'Cancelar',
    });
    return !!resultado.success;
  } catch {
    return false;
  }
}

export async function estaActivada() {
  try {
    return (await AsyncStorage.getItem(FLAG_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function activar() {
  await AsyncStorage.setItem(FLAG_KEY, 'true');
}

export async function desactivar() {
  await AsyncStorage.removeItem(FLAG_KEY);
}
