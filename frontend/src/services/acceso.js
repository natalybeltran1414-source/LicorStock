import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_KEY = 'auth_pin_hash';

function hashPin(pin) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA_256, `licorstock::${pin}`);
}

export async function tienePin() {
  try {
    return !!(await AsyncStorage.getItem(PIN_KEY));
  } catch {
    return false;
  }
}

export async function guardarPin(pin) {
  const h = await hashPin(pin);
  await AsyncStorage.setItem(PIN_KEY, h);
}

export async function verificarPin(pin) {
  try {
    const h = await AsyncStorage.getItem(PIN_KEY);
    if (!h) return false;
    const intento = await hashPin(pin);
    return intento === h;
  } catch {
    return false;
  }
}

export async function quitarPin() {
  await AsyncStorage.removeItem(PIN_KEY);
}
