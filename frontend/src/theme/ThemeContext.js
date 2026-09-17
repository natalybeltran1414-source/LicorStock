import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { PALETAS } from './paletas';

const CLAVE_MODO = '@licostock:modo_tema';
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const sistema = useColorScheme();
  const [modo, setModoEstado] = useState('sistema');

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_MODO)
      .then(guardado => { if (guardado && PALETAS[guardado === 'claro' ? 'claro' : 'oscuro'] && guardado !== 'sistema') setModoEstado(guardado); })
      .catch(() => {});
  }, []);

  const setModo = nuevo => {
    setModoEstado(nuevo);
    AsyncStorage.setItem(CLAVE_MODO, nuevo).catch(() => {});
  };

  const valor = useMemo(() => {
    const clavePaleta = modo === 'sistema' ? (sistema === 'light' ? 'claro' : 'oscuro') : modo;
    const paleta = PALETAS[clavePaleta] || PALETAS.oscuro;
    return { paleta, modo, setModo, esOscuro: paleta.esOscuro };
  }, [modo, sistema]);

  return (
    <ThemeContext.Provider value={valor}>
      <StatusBar style={valor.paleta.esOscuro ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { paleta: PALETAS.oscuro, modo: 'oscuro', setModo: () => {}, esOscuro: true };
  return ctx;
}
