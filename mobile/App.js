import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import KYCScreen from './src/screens/KYCScreen';
import NotificationScreen from './src/screens/NotificationScreen';
import RateAlertScreen from './src/screens/RateAlertScreen';
import TransferScreen from './src/screens/TransferScreen';
import TransactionDetailsScreen from './src/screens/TransactionDetailsScreen';
import TransactionsScreen from './src/screens/TransactionsScreen';
import ComplaintsScreen from './src/screens/ComplaintsScreen';
import ReferralScreen from './src/screens/ReferralScreen';
import RegisterSuccessScreen from './src/screens/RegisterSuccessScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResendVerificationScreen from './src/screens/ResendVerificationScreen';
import { ActivityIndicator, View, Text, Platform, AppState, StyleSheet, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AppLock from './src/components/AppLock';
import ConnectivityManager from './src/components/ConnectivityManager';
import {
  useFonts,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black
} from '@expo-google-fonts/outfit';
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

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
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
          fontFamily: 'Outfit_600SemiBold'
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          if (focused) {
            if (route.name === 'Home') iconName = 'home';
            else if (route.name === 'Transactions') iconName = 'time';
            else if (route.name === 'Watcher') iconName = 'eye';
            else if (route.name === 'Profile') iconName = 'person';
          } else {
            if (route.name === 'Home') iconName = 'home-outline';
            else if (route.name === 'Transactions') iconName = 'time-outline';
            else if (route.name === 'Watcher') iconName = 'eye-outline';
            else if (route.name === 'Profile') iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Transactions" component={TransactionsScreen} options={{ tabBarLabel: 'Transactions' }} />
      <Tab.Screen name="Watcher" component={RateAlertScreen} options={{ tabBarLabel: 'Watcher' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: useAuth().user?.firstName || 'Me' }} />
    </Tab.Navigator>
  );
};

const Navigation = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading === true) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} animating={true} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.background }
        }}
      >
        {user ? (
            <Stack.Group>
                <Stack.Screen name="Main" component={TabNavigator} />
                <Stack.Screen name="Transfer" component={TransferScreen} />
                <Stack.Screen name="TransactionDetails" component={TransactionDetailsScreen} />
                <Stack.Screen name="KYC" component={KYCScreen} />
                <Stack.Screen name="Alerts" component={NotificationScreen} />
                <Stack.Screen name="Complaints" component={ComplaintsScreen} />
                <Stack.Screen name="Referral" component={ReferralScreen} />
            </Stack.Group>
        ) : (
          <Stack.Group>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResendVerification" component={ResendVerificationScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

import { useCallback, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from './src/services/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const toastConfig = {
  success: ({ text1, text2 }) => (
    <View style={toastStyles.toastContainer}>
      <View style={[toastStyles.iconContainer, { backgroundColor: '#10b981' }]}>
        <Ionicons name="checkmark" size={18} color="#fff" />
      </View>
      <View style={toastStyles.content}>
        <Text style={toastStyles.title}>{text1}</Text>
        {text2 ? <Text style={toastStyles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }) => (
    <View style={toastStyles.toastContainer}>
      <View style={[toastStyles.iconContainer, { backgroundColor: '#ef4444' }]}>
        <Ionicons name="close" size={18} color="#fff" />
      </View>
      <View style={toastStyles.content}>
        <Text style={toastStyles.title}>{text1}</Text>
        {text2 ? <Text style={toastStyles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }) => (
    <View style={toastStyles.toastContainer}>
      <View style={[toastStyles.iconContainer, { backgroundColor: '#3b82f6' }]}>
        <Ionicons name="information" size={18} color="#fff" />
      </View>
      <View style={toastStyles.content}>
        <Text style={toastStyles.title}>{text1}</Text>
        {text2 ? <Text style={toastStyles.message}>{text2}</Text> : null}
      </View>
    </View>
  ),
};

const toastStyles = StyleSheet.create({
  toastContainer: {
    height: 'auto',
    minHeight: 50,
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
    color: '#1C1917',
  },
  message: {
    fontSize: 12,
    fontFamily: 'Outfit_400Regular',
    color: '#78716C',
    marginTop: 1,
  },
});

const AnimatedSplashScreen = ({ onAnimationFinish }) => {
  const [opacity] = useState(new Animated.Value(1));
  const [scale] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.sequence([
      Animated.delay(1000), // Hold the splash screen for a moment
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 2.0, // Zoom in effect
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, // Fade out
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onAnimationFinish();
    });
  }, []);

  return (
    <Animated.View
      style={{
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#DC2626', // Match native splash background
        justifyContent: 'center',
        alignItems: 'center',
        opacity: opacity,
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      <Animated.Image
        source={require('./assets/name-logo.png')}
        style={{
          width: '80%',
          height: 200,
          resizeMode: 'contain',
          transform: [{ scale: scale }],
        }}
      />
    </Animated.View>
  );
};

export default function App() {
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  const [fontsLoaded] = useFonts({
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black
  });

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) console.log('Push setup complete. Token ready.');
    });

    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" hidden={false} translucent={true} animated={true} />
          <AppLock />
          <ConnectivityManager />
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <Navigation />
          </View>
          {!isSplashAnimationComplete && (
            <AnimatedSplashScreen onAnimationFinish={() => setAnimationComplete(true)} />
          )}
        </AuthProvider>
      </ThemeProvider>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}
