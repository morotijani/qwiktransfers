import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const ProfileScreen = () => {
    const { user, logout } = useAuth();
    const theme = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleResetPin = () => {
        Alert.prompt(
            'Change Transaction PIN',
            'Enter your new 4-digit PIN',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Update',
                    onPress: async (newPin) => {
                        if (newPin.length !== 4) {
                            Alert.alert('Error', 'PIN must be 4 digits');
                            return;
                        }
                        try {
                            await api.patch('/auth/update-pin', { pin: newPin });
                            Alert.alert('Success', 'Transaction PIN updated successfully!');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to update PIN');
                        }
                    }
                }
            ],
            'secure-text'
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.avatarText}>{user?.full_name?.charAt(0) || 'U'}</Text>
                </View>
                <Text style={[styles.name, { color: theme.text }]}>{user?.full_name}</Text>
                <Text style={[styles.email, { color: theme.textMuted }]}>{user?.email}</Text>
                <View style={[styles.badge, { backgroundColor: user?.kyc_status === 'verified' ? '#10b981' : '#f59e0b' }]}>
                    <Text style={styles.badgeText}>{user?.kyc_status?.toUpperCase() || 'NOT VERIFIED'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Account Details</Text>
                <View style={[styles.item, { backgroundColor: theme.card }]}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>QT Account #</Text>
                    <Text style={[styles.itemValue, { color: theme.textMuted }]}>{user?.account_number || 'N/A'}</Text>
                </View>
                <View style={[styles.item, { backgroundColor: theme.card }]}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>Phone Number</Text>
                    <Text style={[styles.itemValue, { color: theme.textMuted }]}>{user?.phone || 'Not set'}</Text>
                </View>
                <View style={[styles.item, { backgroundColor: theme.card }]}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>Country</Text>
                    <Text style={[styles.itemValue, { color: theme.textMuted }]}>{user?.country || 'Not set'}</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.primary }]}>Security & Preferences</Text>
                <TouchableOpacity style={[styles.item, { backgroundColor: theme.card }]} onPress={handleResetPin}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>Change Transaction PIN</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <View style={[styles.item, { backgroundColor: theme.card }]}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>Enable Notifications</Text>
                    <Switch
                        value={notificationsEnabled === true}
                        onValueChange={(val) => setNotificationsEnabled(val)}
                        trackColor={{ [false]: '#334155', [true]: '#818cf8' }}
                        thumbColor={notificationsEnabled ? theme.primary : '#94a3b8'}
                    />
                </View>
                <View style={[styles.item, { backgroundColor: theme.card }]}>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>Dark Mode</Text>
                    <Switch
                        value={theme.isDark}
                        onValueChange={() => theme.toggleTheme()}
                        trackColor={{ [false]: '#e2e8f0', [true]: '#1e293b' }}
                        thumbColor={theme.isDark ? theme.primary : '#f8fafc'}
                    />
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                <Text style={styles.logoutText}>Logout from Device</Text>
            </TouchableOpacity>

            <Text style={[styles.version, { color: theme.textMuted }]}>Version 1.0.0 (Build 2026)</Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    header: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#6366f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    name: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc' },
    email: { fontSize: 14, color: '#94a3b8', marginTop: 5 },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 15,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },
    section: {
        marginTop: 25,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#818cf8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
    },
    item: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    itemLabel: { color: '#f8fafc', fontSize: 15 },
    itemValue: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
    chevron: { color: '#64748b', fontSize: 20 },
    logoutButton: {
        marginHorizontal: 20,
        marginTop: 30,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
    version: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 12,
        marginTop: 20,
        marginBottom: 40,
    },
});

export default ProfileScreen;
