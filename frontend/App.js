import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import {
  getSession,
  clearSession,
  sesionExpirada,
  marcarActividad,
} from './src/services/api';
import { estaActivada as biometriaActivada } from './src/services/biometria';
import { colors } from './src/theme/colors';

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [navKey, setNavKey] = useState(0);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      try {
        const { access } = await getSession();
        if (!access || (await sesionExpirada())) {
          if (access) await clearSession();
          setInitialRoute('Login');
          return;
        }
        const usaBiometria = await biometriaActivada();
        setInitialRoute(usaBiometria ? 'Bloqueo' : 'MainApp');
      } catch {
        setInitialRoute('Login');
      }
    })();
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async estado => {
      const previa = appState.current;
      appState.current = estado;
      if (estado === 'background') {
        marcarActividad();
        return;
      }
      if (
        estado === 'active' &&
        previa === 'background' &&
        initialRoute !== null &&
        (await sesionExpirada())
      ) {
        await clearSession();
        setInitialRoute('Login');
        setNavKey(k => k + 1); // remonta la app en el login
      }
    });
    return () => sub.remove();
  }, [initialRoute]);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator key={navKey} initialRoute={initialRoute} />
    </>
  );
}
