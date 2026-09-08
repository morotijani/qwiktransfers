import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ImageBackground,
    Image,
    Animated,
    Dimensions,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { errorToast, successToast } from '../utils/toast';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authenticateAsync } from '../services/biometrics';
import Button from '../components/Button';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';

const { width, height } = Dimensions.get('window');

// Resilient Glassmorphism fallback
// GlassContainer removed - using standard themed Views now

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [show2FA, setShow2FA] = useState(false);
    const { login, loginWithBiometrics } = useAuth();
    const [loading, setLoading] = useState(false);
    const [rate, setRate] = useState(null);
    const [canUseBiometrics, setCanUseBiometrics] = useState(false);
    const theme = useTheme();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        fetchRate();
        checkBiometricAvailability();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const checkBiometricAvailability = async () => {
        const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
        const bioToken = await AsyncStorage.getItem('biometricToken');
        if (bioEnabled === 'true' && bioToken) {
            setCanUseBiometrics(true);
        }
    };

    const handleBiometricLogin = async () => {
        const result = await authenticateAsync('Sign in to QwikTransfers');
        if (result.success) {
            setLoading(true);
            const loggedIn = await loginWithBiometrics();
            setLoading(false);
            if (!loggedIn) {
                errorToast('Session Expired', 'Your session has expired. Please log in with your password again.');
            }
        }
    };

    const fetchRate = async () => {
        try {
            const response = await api.get('/rates');
            const rawRate = response.data.rate;
            const displayRate = rawRate < 1 ? (1 / rawRate) : rawRate;
            setRate(displayRate.toFixed(2));
        } catch (error) {
            console.log('Failed to fetch rate', error);
        }
    };

    const handleLogin = async () => {
        if (!show2FA && (!email || !password)) {
            errorToast('Error', 'Please enter email and password');
            return;
        }
        if (show2FA && (!otp)) {
            errorToast('Error', 'Please enter your Transaction PIN / OTP');
            return;
        }
        setLoading(true);
        try {
            const res = await login(email, password, show2FA ? otp : null);
            if (res && res.requires_2fa) {
                setShow2FA(true);
                setLoading(false);
                successToast('PIN Required', 'Please enter your Transaction PIN to continue.');
                return;
            }
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                errorToast('Timeout', 'Login request timed out. Please check your internet connection.');
            } else if (!error.response) {
                errorToast('Network Error', 'Please check your internet connection and try again.');
            } else {
                errorToast(
                    'Access Denied',
                    `Login failed. ${error.response?.data?.error || 'Invalid email or password'}`
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.flex}
            >
                <Animated.ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingBottom: 40 }
                    ]}
                    style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Floating Rate Badge */}
                    {rate && (
                        <View style={[styles.rateBadge, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                            <View style={styles.rateInner}>
                                <Ionicons name="trending-up" size={14} color={theme.primary} style={styles.rateIcon} />
                                <Text style={[styles.rateText, { color: theme.text }]}>
                                    1 CAD = <Text style={[styles.rateHighlight, { color: theme.primary }]}>{rate} GHS</Text>
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <Image
                            source={theme.isDark ? require('../../assets/logo-white.png') : require('../../assets/logo-red.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
                        <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>Fast. Secure. Worldwide.</Text>
                    </View>

                    {/* Login Card */}
                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        {!show2FA && (
                            <View style={styles.cardHeader}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Welcome Back</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textMuted }]}>Sign in to your account</Text>
                            </View>
                        )}

                        <View style={styles.form}>
                            {!show2FA ? (
                                <>
                                    <View style={styles.inputContainer}>
                                        <Input
                                            placeholder="Email Address"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Input
                                            placeholder="Password"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={true}
                                        />
                                        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                                            <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot?</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            ) : (
                                <View style={[styles.inputContainer, { alignItems: 'center', marginBottom: 24 }]}>
                                    <Text style={[styles.cardSubtitle, { color: theme.textMuted, marginBottom: 16 }]}>Enter Transaction PIN</Text>
                                    <OTPInput 
                                        value={otp} 
                                        onChange={setOtp} 
                                        length={4} 
                                    />
                                    <TouchableOpacity style={{ marginTop: 24 }} onPress={() => { setShow2FA(false); setOtp(''); }}>
                                        <Text style={[styles.forgotText, { color: theme.primary }]}>Back to Login</Text>
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Button
                                label={show2FA ? "Verify & Login" : "Login"}
                                onPress={handleLogin}
                                loading={loading}
                                style={styles.loginBtn}
                            />

                            {!show2FA && canUseBiometrics && (
                                <TouchableOpacity
                                    style={styles.bioBtn}
                                    onPress={handleBiometricLogin}
                                    disabled={loading}
                                >
                                    <View style={[styles.bioCircle, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
                                        <Ionicons name="finger-print" size={32} color={theme.primary} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={{ alignItems: 'center', marginTop: 40, paddingBottom: 20 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={[styles.linkText, { color: theme.primary }]}>Create Account</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.navigate('ResendVerification')}>
                            <Text style={[styles.footerText, { color: theme.textMuted, fontSize: 14 }]}>Didn't receive verification email?</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    rateBadge: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginBottom: 30,
        borderWidth: 1.5,
    },
    rateInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rateIcon: {
        marginRight: 8,
    },
    rateText: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    rateHighlight: {
        fontFamily: 'Outfit_700Bold',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 220,
        height: 60,
    },
    brandSubtitle: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
        marginTop: 8,
        letterSpacing: 2,
    },
    card: {
        width: '100%',
        borderRadius: 32,
        padding: 24,
        borderWidth: 1,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    cardHeader: {
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 16,
        position: 'relative',
    },
    forgotBtn: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    forgotText: {
        fontSize: 13,
        fontFamily: 'Outfit_600SemiBold',
    },
    loginBtn: {
        height: 60,
        borderRadius: 30,
        marginTop: 10,
    },
    bioBtn: {
        alignSelf: 'center',
        marginTop: 20,
    },
    bioCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    footer: {
        flexDirection: 'row',
        marginTop: 40,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
    },
    linkText: {
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
        marginLeft: 8,
    },
});

export default LoginScreen;
