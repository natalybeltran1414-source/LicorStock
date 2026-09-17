import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { radius } from '../theme/colors';
import { ThemeProvider, useTema } from '../theme/ThemeContext';

import LoginScreen from '../screens/LoginScreen';
import RegistroScreen from '../screens/RegistroScreen';
import BloqueoScreen from '../screens/BloqueoScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductosScreen from '../screens/ProductosScreen';
import InventarioScreen from '../screens/InventarioScreen';
import MovimientosScreen from '../screens/MovimientosScreen';
import VentasScreen from '../screens/VentasScreen';
import ClientesScreen from '../screens/ClientesScreen';
import CuentasScreen from '../screens/CuentasScreen';
import PerfilScreen from '../screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: 'grid-outline',
  Productos: 'wine-outline',
  Inventario: 'cube-outline',
  Movimientos: 'swap-vertical-outline',
  Ventas: 'receipt-outline',
  Clientes: 'people-outline',
};

function MainTabNavigator() {
  const { paleta: c } = useTema();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.goldLight,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.borderSubtle,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ focused, color }) => (
          <View style={[styles.tabIconWrap, focused && { backgroundColor: c.gold }]}>
            <Ionicons
              name={focused ? TAB_ICONS[route.name].replace('-outline', '') : TAB_ICONS[route.name]}
              size={20}
              color={focused ? c.sobreDorado : color}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Productos" component={ProductosScreen} />
      <Tab.Screen name="Inventario" component={InventarioScreen} />
      <Tab.Screen name="Movimientos" component={MovimientosScreen} />
      <Tab.Screen name="Ventas" component={VentasScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ initialRoute = 'Login' }) {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Registro" component={RegistroScreen} />
          <Stack.Screen name="Bloqueo" component={BloqueoScreen} />
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          <Stack.Screen name="Cuentas" component={CuentasScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  tabIconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
