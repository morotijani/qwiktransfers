import React, { useState } from 'react';
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
    SafeAreaView,
    ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const theme = useTheme();

    const handleRegister = async () => {
        if (!email || !password || !fullName) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register({
                email,
                password,
                full_name: fullName,
                phone
            });
            // Registration success is handled in AuthContext (usually auto-login or redirect)
        } catch (error) {
            Alert.alert('Error', 'Registration failed. Please check your details and internet connection.');
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
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.primary }]}>JOIN<Text style={{ color: theme.text }}> QWIKTRANSFERS</Text></Text>
                        <Text style={[styles.subtitle, { color: theme.textMuted }]}>Create an account to start sending</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Full Legal Name</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                placeholder="John Doe"
                                placeholderTextColor={theme.textMuted}
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

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
                            <Text style={[styles.label, { color: theme.textMuted }]}>Phone Number (Optional)</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                                placeholder="+1 234 567 890"
                                placeholderTextColor={theme.textMuted}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Password</Text>
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
                            onPress={handleRegister}
                            disabled={loading === true}
                        >
                            <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign up'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textMuted }]}>Already have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={[styles.link, { color: theme.primary }]}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
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
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 40,
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 32,
        letterSpacing: -1,
        fontWeight: '900',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '500',
    },
    form: {
        width: '100%',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 56,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        borderWidth: 1.5,
    },
    button: {
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    footerText: {
        fontSize: 14,
        marginRight: 8,
    },
    link: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default RegisterScreen;
