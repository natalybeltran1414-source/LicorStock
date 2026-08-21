import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme/colors';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductosScreen from '../screens/ProductosScreen';
import InventarioScreen from '../screens/InventarioScreen';
import VentasScreen from '../screens/VentasScreen';
import ClientesScreen from '../screens/ClientesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: 'grid-outline',
  Productos: 'wine-outline',
  Inventario: 'cube-outline',
  Ventas: 'receipt-outline',
  Clientes: 'people-outline',
};

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.goldLight,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
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
          <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
            <Ionicons
              name={focused ? TAB_ICONS[route.name].replace('-outline', '') : TAB_ICONS[route.name]}
              size={20}
              color={focused ? '#1A1408' : color}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Productos" component={ProductosScreen} />
      <Tab.Screen name="Inventario" component={InventarioScreen} />
      <Tab.Screen name="Ventas" component={VentasScreen} />
      <Tab.Screen name="Clientes" component={ClientesScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
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
  tabIconActive: {
    backgroundColor: colors.gold,
  },
});
