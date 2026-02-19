import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import KYCScreen from './src/screens/KYCScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import RateAlertScreen from './src/screens/RateAlertScreen';
import TransferScreen from './src/screens/TransferScreen';
import { ActivityIndicator, View, Text, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          height: Platform.OS === 'ios' ? 88 : 65,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          elevation: 0,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: -4 },
        tabBarIcon: ({ color, size, focused }) => {
          let icon;
          // Coinbase-style minimalist icons (using text for now as placeholders for vector icons)
          if (route.name === 'Home') icon = '◆';
          else if (route.name === 'Verify') icon = '🛡';
          else if (route.name === 'Alerts') icon = '●';
          else if (route.name === 'Rates') icon = '▲';
          else if (route.name === 'Profile') icon = '👤';
          return (
            <Text style={{
              fontSize: 24,
              color: color,
              fontWeight: focused ? '900' : '400',
              opacity: focused ? 1 : 0.6
            }}>{icon}</Text>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Assets' }} />
      <Tab.Screen name="Verify" component={KYCScreen} options={{ tabBarLabel: 'Verify' }} />
      <Tab.Screen name="Alerts" component={NotificationScreen} options={{ tabBarLabel: 'Activity' }} />
      <Tab.Screen name="Rates" component={RateAlertScreen} options={{ tabBarLabel: 'Rates' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading === true) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#818cf8" animating={true} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Group>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Transfer" component={TransferScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" hidden={false} translucent={true} animated={true} />
        <Navigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
