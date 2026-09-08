import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    AppState,
    Modal,
    Platform,
    StatusBar,
    Haptics
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ExpoHaptics from 'expo-haptics';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authenticateAsync } from '../services/biometrics';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AppLock = () => {
    const { user, isAppLocked, setIsAppLocked, verifyAppPin, isPickingFile } = useAuth();
    const theme = useTheme();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const appState = useRef(AppState.currentState);
    const isAuthenticating = useRef(false);
    const pickingRef = useRef(isPickingFile);

    // Sync ref with state
    useEffect(() => {
        pickingRef.current = isPickingFile;
    }, [isPickingFile]);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (
                appState.current.match(/active/) &&
                nextAppState.match(/inactive|background/)
            ) {
                if (user && !isAuthenticating.current && !pickingRef.current) {
                    setIsAppLocked(true);
                }
            }
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                if (user && isAppLocked && !isAuthenticating.current) {
                   attemptBiometricUnlock();
                }
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, [user, isAppLocked, setIsAppLocked]);

    useEffect(() => {
        if (isAppLocked && user && !isAuthenticating.current) {
            attemptBiometricUnlock();
        }
    }, [isAppLocked, user]);

    const attemptBiometricUnlock = async () => {
        if (isAuthenticating.current) return;
        
        const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (bioEnabled === 'true') {
            isAuthenticating.current = true;
            try {
                const result = await authenticateAsync('Unlock QwikTransfers');
                if (result.success) {
                    setIsAppLocked(false);
                    setPin('');
                    setError('');
                }
            } finally {
                setTimeout(() => {
                    isAuthenticating.current = false;
                }, 500);
            }
        }
    };

    const handlePress = (num) => {
        if (loading) return;
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                handleVerify(newPin);
            }
        }
    };

    const handleDelete = () => {
        if (loading) return;
        ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Light);
        setPin(pin.slice(0, -1));
        setError('');
    };

    const handleVerify = async (fullPin) => {
        setLoading(true);
        const result = await verifyAppPin(fullPin);
        if (result.success) {
            setIsAppLocked(false);
            setPin('');
            setError('');
        } else {
            setPin('');
            setError(result.error);
            ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error);
        }
        setLoading(false);
    };

    if (!isAppLocked || !user) return null;
    const isDark = theme.isDark;

    return (
        <Modal visible={true} animationType="fade" transparent={false}>
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <View style={[styles.iconCircle, { backgroundColor: isDark ? '#374151' : '#f3f4f6' }]}>
                                <Ionicons name="lock-closed" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.title, { color: theme.text }]}>Security Lock</Text>
                            <Text style={[styles.subtitle, { color: theme.textMuted }]}>Enter your PIN to continue</Text>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.pinContainer}>
                                {[1, 2, 3, 4].map((i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.pinDot,
                                            { borderColor: theme.border || (isDark ? '#4b5563' : '#d1d5db') },
                                            pin.length >= i && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                    />
                                ))}
                            </View>

                            <View style={styles.errorContainer}>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                            </View>

                            <View style={styles.keypad}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <TouchableOpacity
                                        key={num}
                                        style={[styles.key, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}
                                        onPress={() => handlePress(num.toString())}
                                    >
                                        <Text style={[styles.keyText, { color: theme.text }]}>{num}</Text>
                                    </TouchableOpacity>
                                ))}
                                <TouchableOpacity
                                    style={[styles.key, { backgroundColor: 'transparent' }]}
                                    onPress={attemptBiometricUnlock}
                                >
                                    <Ionicons name="finger-print" size={32} color={theme.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.key, { backgroundColor: isDark ? '#1f2937' : '#f9fafb' }]}
                                    onPress={() => handlePress('0')}
                                >
                                    <Text style={[styles.keyText, { color: theme.text }]}>0</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.key, { backgroundColor: 'transparent' }]}
                                    onPress={handleDelete}
                                >
                                    <Ionicons name="backspace-outline" size={28} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <Text style={[styles.loadingText, { color: theme.textMuted }]}>Authenticating...</Text>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: Platform.OS === 'ios' ? 20 : 40,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 26,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },
    formContainer: {
        width: '100%',
        alignItems: 'center',
    },
    pinContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 20,
    },
    pinDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
    },
    errorContainer: {
        height: 24,
        marginBottom: 20,
    },
    errorText: {
        color: '#ef4444',
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        justifyContent: 'center',
        gap: 16,
    },
    key: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyText: {
        fontSize: 28,
        fontFamily: 'Outfit_600SemiBold',
    },
    loadingOverlay: {
        marginTop: 40,
    },
    loadingText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
    }
});

export default AppLock;
