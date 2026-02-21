import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const RateAlertScreen = () => {
    const theme = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [targetRate, setTargetRate] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [currentRate, setCurrentRate] = useState(15.85); // Mock current rate or fetch from API

    const fetchAlerts = async () => {
        try {
            const [alertsRes, rateRes] = await Promise.all([
                api.get('/system/rate-alerts'),
                api.get('/rates')
            ]);
            setAlerts(alertsRes.data);

            // Logic: API returns GHS -> CAD (e.g., 0.063)
            // We want to show 1 CAD -> GHS (e.g., 15.85)
            const rawRate = rateRes.data.rate || 0.063;
            const displayRate = rawRate < 1 ? (1 / rawRate) : rawRate;
            setCurrentRate(displayRate);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleSetAlert = async () => {
        if (!targetRate) return;
        setSubmitting(true);
        try {
            await api.post('/system/rate-alerts', { targetRate: parseFloat(targetRate), direction: 'above' });
            Alert.alert('Success', 'We\'ll notify you when the rate hits your target.');
            setTargetRate('');
            Keyboard.dismiss();
            fetchAlerts();
        } catch (error) {
            Alert.alert('Error', 'Failed to set alert');
        } finally {
            setSubmitting(false);
        }
    };

    const deleteAlert = async (id) => {
        try {
            await api.delete(`/system/rate-alerts/${id}`);
            setAlerts(alerts.filter(a => a.id !== id));
        } catch (error) {
            Alert.alert('Error', 'Failed to delete alert');
        }
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                keyboardShouldPersistTaps="handled"
            >
                {/* Header */}
                <Text style={[styles.screenTitle, { color: theme.text }]}>Rate Watcher</Text>

                {/* Big Rate Display */}
                <View style={styles.rateDisplay}>
                    <Text style={[styles.rateLabel, { color: theme.textMuted }]}>Current Rate</Text>
                    <View style={styles.rateValueContainer}>
                        <Text style={[styles.currency, { color: theme.textMuted }]}>1 CAD =</Text>
                        <Text style={[styles.rateValue, { color: theme.text }]}> {currentRate.toFixed(2)}</Text>
                        <Text style={[styles.currency, { color: theme.textMuted }]}> GHS</Text>
                    </View>
                </View>

                {/* Input Card */}
                <View style={[styles.inputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.inputLabel, { color: theme.text }]}>Notify me when rate is above</Text>

                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.bigInput, { color: theme.primary }]}
                            placeholder="0.00"
                            placeholderTextColor={theme.textMuted + '50'}
                            value={targetRate}
                            onChangeText={setTargetRate}
                            keyboardType="decimal-pad"
                        />
                        <Text style={[styles.inputSuffix, { color: theme.textMuted }]}>GHS</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, { backgroundColor: theme.primary, opacity: targetRate ? 1 : 0.6 }]}
                        onPress={handleSetAlert}
                        disabled={!targetRate || submitting}
                    >
                        {submitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.createBtnText}>Create Alert</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Active Alerts List */}
                <Text style={[styles.sectionHeader, { color: theme.textMuted }]}>ACTIVE ALERTS</Text>

                {alerts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off-outline" size={40} color={theme.textMuted} style={{ opacity: 0.5 }} />
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No active alerts</Text>
                    </View>
                ) : (
                    <View style={styles.alertList}>
                        {alerts.map(alert => (
                            <View key={alert.id} style={[styles.alertItem, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                                <View style={styles.alertInfo}>
                                    <View style={[styles.bellIcon, { backgroundColor: theme.primary + '15' }]}>
                                        <Ionicons name="notifications" size={18} color={theme.primary} />
                                    </View>
                                    <Text style={[styles.alertText, { color: theme.text }]}>
                                        Above <Text style={{ fontFamily: 'Outfit_700Bold' }}>{parseFloat(alert.targetRate).toFixed(2)}</Text>
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => deleteAlert(alert.id)} style={styles.deleteBtn}>
                                    <Ionicons name="close-circle-outline" size={24} color={theme.textMuted} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    screenTitle: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 30,
        marginTop: 10,
    },
    rateDisplay: {
        marginBottom: 40,
    },
    rateLabel: {
        fontSize: 14,
        fontFamily: 'Outfit_600SemiBold',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    rateValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    rateValue: {
        fontSize: 48,
        fontFamily: 'Outfit_700Bold',
        lineHeight: 56,
    },
    currency: {
        fontSize: 20,
        fontFamily: 'Outfit_500Medium',
    },
    inputCard: {
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 8,
    },
    bigInput: {
        fontSize: 36,
        fontFamily: 'Outfit_700Bold',
        flex: 1,
        padding: 0,
    },
    inputSuffix: {
        fontSize: 20,
        fontFamily: 'Outfit_600SemiBold',
    },
    createBtn: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createBtnText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Outfit_700Bold',
    },
    sectionHeader: {
        fontSize: 13,
        fontFamily: 'Outfit_700Bold',
        letterSpacing: 1,
        marginBottom: 16,
    },
    alertList: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    alertItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    alertInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    bellIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    alertText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 16,
    }
});

export default RateAlertScreen;
