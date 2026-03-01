import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    TextInput,
    ActivityIndicator,
    Image,
    StatusBar,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isBiometricSupported } from '../services/biometrics';

const ProfileScreen = () => {
    const { user, logout, refreshProfile } = useAuth();
    const theme = useTheme();
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Security State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [pin, setPin] = useState('');

    // Biometrics State
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [biometricSupported, setBiometricSupported] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.full_name || '');
            setPhone(user.phone || '');
        }
    }, [user]);

    useEffect(() => {
        const checkBiometrics = async () => {
            const supported = await isBiometricSupported();
            setBiometricSupported(supported);
            if (supported) {
                const saved = await AsyncStorage.getItem('biometricEnabled');
                if (saved === 'true') {
                    setBiometricEnabled(true);
                }
            }
        };
        checkBiometrics();
    }, []);

    const handleBiometricToggle = async (value) => {
        setBiometricEnabled(value);
        await AsyncStorage.setItem('biometricEnabled', value ? 'true' : 'false');
        if (value) {
            const currentToken = await AsyncStorage.getItem('token');
            if (currentToken) {
                await AsyncStorage.setItem('biometricToken', currentToken);
            }
        } else {
            await AsyncStorage.removeItem('biometricToken');
        }
    };

    const handleUpdateProfile = async () => {
        if (!fullName || !phone) {
            Alert.alert('Error', 'Full name and phone are required');
            return;
        }
        setLoading(true);
        try {
            await api.patch('/auth/profile', { full_name: fullName, phone });
            await refreshProfile();
            Alert.alert('Success', 'Profile updated successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Both current and new passwords are required');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/change-password', { currentPassword, newPassword });
            Alert.alert('Success', 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleSetPin = async () => {
        if (!/^\d{4}$/.test(pin)) {
            Alert.alert('Error', 'PIN must be exactly 4 digits');
            return;
        }
        setLoading(true);
        try {
            await api.post('/auth/set-pin', { pin });
            Alert.alert('Success', 'Transaction PIN updated successfully!');
            setPin('');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to set PIN');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need permission to access your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            const formData = new FormData();
            const uri = result.assets[0].uri;
            const filename = uri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image`;

            formData.append('avatar', {
                uri,
                name: filename,
                type
            });

            setLoading(true);
            try {
                await api.post('/auth/avatar', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                await refreshProfile();
                Alert.alert('Success', 'Profile picture updated!');
            } catch (error) {
                console.error(error);
                Alert.alert('Error', 'Failed to upload image');
            } finally {
                setLoading(false);
            }
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={handleAvatarUpload} activeOpacity={0.8} style={styles.avatarContainer}>
                {user?.profile_picture ? (
                    <Image
                        source={{ uri: api.defaults.baseURL.replace('/api', '') + user.profile_picture }}
                        style={styles.avatarImage}
                    />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                            {user?.full_name?.charAt(0) || 'U'}
                        </Text>
                    </View>
                )}
                <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
                    <Ionicons name="camera" size={12} color="#fff" />
                </View>
            </TouchableOpacity>
            <Text style={[styles.userName, { color: theme.text }]}>{user?.full_name}</Text>
            <Text style={[styles.userEmail, { color: theme.textMuted }]}>{user?.email}</Text>
            <View style={[styles.kycBadge, { backgroundColor: user?.kyc_status === 'verified' ? '#10b981' : '#f59e0b' }]}>
                <Ionicons
                    name={user?.kyc_status === 'verified' ? "shield-checkmark" : "shield-outline"}
                    size={10}
                    color="#fff"
                    style={{ marginRight: 4 }}
                />
                <Text style={styles.kycText}>{user?.kyc_status?.toUpperCase() || 'UNVERIFIED'}</Text>
            </View>
        </View>
    );

    const renderSection = (title, icon, children) => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name={icon} size={18} color={theme.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
            <ScrollView showsVerticalScrollIndicator={false}>
                {renderHeader()}

                {renderSection('Personal Information', 'person-outline', (
                    <View style={styles.cardContent}>
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Full Name</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Enter your full name"
                                placeholderTextColor={theme.textMuted}
                            />
                        </View>
                        <View style={[styles.inputGroup, { marginBottom: 20 }]}>
                            <Text style={[styles.label, { color: theme.textMuted }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="+233..."
                                placeholderTextColor={theme.textMuted}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.smallButton, { backgroundColor: theme.primary }]}
                            onPress={handleUpdateProfile}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Update Info</Text>}
                        </TouchableOpacity>
                    </View>
                ))}

                {renderSection('Security', 'lock-closed-outline', (
                    <View style={styles.cardContent}>
                        <Text style={[styles.subLabel, { color: theme.textMuted, marginBottom: 12 }]}>Change Password</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 10 }]}
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            placeholder="Current Password"
                            placeholderTextColor={theme.textMuted}
                        />
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 16 }]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            placeholder="New Password"
                            placeholderTextColor={theme.textMuted}
                        />
                        <TouchableOpacity
                            style={[styles.smallButton, { backgroundColor: theme.primary, marginBottom: 24 }]}
                            onPress={handleChangePassword}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Update Password</Text>
                        </TouchableOpacity>

                        <Text style={[styles.subLabel, { color: theme.textMuted, marginBottom: 12 }]}>Transaction PIN</Text>
                        <TextInput
                            style={[styles.input, { color: theme.text, backgroundColor: theme.background, marginBottom: 16 }]}
                            value={pin}
                            onChangeText={(val) => setPin(val.replace(/\D/g, ''))}
                            secureTextEntry
                            maxLength={4}
                            keyboardType="number-pad"
                            placeholder="4-Digit PIN"
                            placeholderTextColor={theme.textMuted}
                        />
                        <TouchableOpacity
                            style={[styles.smallButton, { backgroundColor: theme.primary }]}
                            onPress={handleSetPin}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Set Transaction PIN</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {renderSection('Preferences', 'settings-outline', (
                    <View style={styles.cardContent}>
                        <View style={styles.row}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
                            <Switch
                                value={theme.isDark}
                                onValueChange={theme.toggleTheme}
                                trackColor={{ false: '#767577', true: theme.primary + '50' }}
                                thumbColor={theme.isDark ? theme.primary : '#f4f3f4'}
                            />
                        </View>
                        <View style={[styles.row, { borderBottomWidth: biometricSupported ? 0.5 : 0 }]}>
                            <Text style={[styles.rowLabel, { color: theme.text }]}>Push Notifications</Text>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                trackColor={{ false: '#767577', true: theme.primary + '50' }}
                                thumbColor={notificationsEnabled ? theme.primary : '#f4f3f4'}
                            />
                        </View>
                        {biometricSupported && (
                            <View style={[styles.row, { borderBottomWidth: 0 }]}>
                                <Text style={[styles.rowLabel, { color: theme.text }]}>Biometric Login</Text>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={handleBiometricToggle}
                                    trackColor={{ false: '#767577', true: theme.primary + '50' }}
                                    thumbColor={biometricEnabled ? theme.primary : '#f4f3f4'}
                                />
                            </View>
                        )}
                    </View>
                ))}

                {renderSection('Account Details', 'information-circle-outline', (
                    <View style={styles.cardContent}>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Account Number</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{user?.account_number}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Region</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>{user?.country}</Text>
                        </View>
                        <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                            <Text style={[styles.detailLabel, { color: theme.textMuted }]}>Joined</Text>
                            <Text style={[styles.detailValue, { color: theme.text }]}>
                                {new Date(user?.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                ))}

                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={[styles.version, { color: theme.textMuted }]}>QwikTransfers Mobile v1.0.0</Text>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarText: {
        fontSize: 42,
        fontFamily: 'Outfit_700Bold',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    userName: {
        fontSize: 24,
        fontFamily: 'Outfit_700Bold',
    },
    userEmail: {
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
        marginTop: 4,
    },
    kycBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 12,
    },
    kycText: {
        color: '#fff',
        fontSize: 10,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 0.5,
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardContent: {
        padding: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        fontFamily: 'Outfit_500Medium',
        marginBottom: 8,
    },
    subLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
    },
    input: {
        height: 52,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: 'Outfit_400Regular',
    },
    smallButton: {
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 15,
        fontFamily: 'Outfit_600SemiBold',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    rowLabel: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    detailLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_400Regular',
    },
    detailValue: {
        fontSize: 14,
        fontFamily: 'Outfit_500Medium',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        marginBottom: 20,
    },
    logoutText: {
        color: '#ef4444',
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
    },
    version: {
        textAlign: 'center',
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
    },
});

export default ProfileScreen;
