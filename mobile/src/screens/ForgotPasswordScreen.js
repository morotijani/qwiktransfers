import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import Toast from 'react-native-toast-message';

const ForgotPasswordScreen = ({ navigation }) => {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendLink = async () => {
        if (!email.trim() || !email.includes('@')) {
            Toast.show({
                type: 'error',
                text1: 'Invalid Email',
                text2: 'Please enter a valid email address.'
            });
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/auth/forgot-password', { email: email.toLowerCase().trim() });
            Toast.show({
                type: 'success',
                text1: 'Link Sent!',
                text2: response.data.message || 'Check your email for the reset link.'
            });
            setTimeout(() => {
                navigation.goBack();
            }, 2500);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Failed',
                text2: error.response?.data?.error || 'Failed to send reset link.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.flex}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                </View>

                <Animated.View style={styles.content}>
                    <View style={styles.headerContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="lock-closed-outline" size={40} color={theme.primary} />
                        </View>
                        <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
                        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                            Enter your email address and we'll send you a link to securely reset your password on our website.
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.form}>
                            <View style={styles.inputContainer}>
                                <Input
                                    placeholder="Email Address"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>

                            <Button
                                label="Send Reset Link"
                                onPress={handleSendLink}
                                loading={loading}
                                style={styles.submitBtn}
                            />
                        </View>
                    </View>
                </Animated.View>
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backBtn: {
        padding: 8,
        marginLeft: -8,
        alignSelf: 'flex-start',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
        alignItems: 'center',
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Outfit_400Regular',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 10,
    },
    card: {
        width: '100%',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    form: {
        marginTop: 10,
    },
    inputContainer: {
        marginBottom: 20,
    },
    submitBtn: {
        marginTop: 10,
        width: '100%',
    }
});

export default ForgotPasswordScreen;
