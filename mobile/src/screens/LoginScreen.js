import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [rate, setRate] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        fetchRate();
    }, []);

    const fetchRate = async () => {
        try {
            const response = await api.get('/rates');
            const rawRate = response.data.rate;
            // Ensure we display CAD -> GHS (should be > 1)
            const displayRate = rawRate < 1 ? (1 / rawRate) : rawRate;
            setRate(displayRate.toFixed(2));
        } catch (error) {
            console.log('Failed to fetch rate', error);
        }
    };

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            Alert.alert(
                'Login Failed',
                'Invalid email or password. Please also ensure your API_URL is correctly set to your local IP in api.js.'
            );
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
                <View style={styles.content}>

                    {/* Rate Display */}
                    {rate && (
                        <View style={[styles.rateContainer, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '20' }]}>
                            <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
                                <Ionicons name="trending-up" size={14} color="#fff" />
                            </View>
                            <Text style={[styles.rateText, { color: theme.text }]}>
                                1 CAD <Text style={{ color: theme.textMuted }}>=</Text> <Text style={{ color: theme.primary, fontFamily: 'Outfit_700Bold' }}>{rate} GHS</Text>
                            </Text>
                        </View>
                    )}

                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.primary }]}>QWIK<Text style={{ color: theme.text }}>TRANSFERS</Text></Text>
                        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Sign in to your account</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Email</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                placeholder="name@example.com"
                                placeholderTextColor={theme.textMuted}
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, { color: theme.textMuted }]}>Password</Text>
                                <TouchableOpacity>
                                    <Text style={[styles.forgotToken, { color: theme.primary }]}>Forgot password?</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textMuted}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={true}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.primary }, loading ? { opacity: 0.7 } : null]}
                            onPress={handleLogin}
                            disabled={loading === true}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Sign in</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.link, { color: theme.primary }]}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    rateContainer: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    iconCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    rateText: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    header: {
        marginBottom: 40,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 34,
        letterSpacing: -1.5,
        fontWeight: '700',
        marginBottom: 8,
        fontFamily: 'Outfit_700Bold',
    },
    subtitle: {
        fontSize: 17,
        fontWeight: '400',
        fontFamily: 'Outfit_400Regular',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 24,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    forgotToken: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    input: {
        height: 58,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1.5,
        fontFamily: 'Outfit_400Regular',
    },
    button: {
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        fontSize: 15,
        marginRight: 8,
        fontFamily: 'Outfit_400Regular',
    },
    link: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
});

export default LoginScreen;
