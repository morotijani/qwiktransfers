import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const RateAlertScreen = () => {
    const theme = useTheme();
    const [alerts, setAlerts] = useState([]);
    const [targetRate, setTargetRate] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchAlerts = async () => {
        try {
            const res = await api.get('/system/rate-alerts');
            setAlerts(res.data);
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
            Alert.alert('Success', 'Rate alert set! We will notify you when GHS reaches this rate.');
            setTargetRate('');
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
                <ActivityIndicator size="large" color={theme.primary} animating={true} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.background }]}
            scrollEnabled={true}
            removeClippedSubviews={false}
        >
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Rate Watcher</Text>
                <Text style={[styles.subtitle, { color: theme.textMuted }]}>Set alerts to get notified when exchange rates reach your targets.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.primary }]}>Target Rate (1 CAD = ??? GHS)</Text>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.input, borderColor: theme.border, color: theme.text }]}
                        placeholder="e.g. 15.50"
                        placeholderTextColor={theme.textMuted}
                        value={targetRate}
                        onChangeText={setTargetRate}
                        keyboardType="decimal-pad"
                    />
                    <TouchableOpacity
                        style={[styles.setButton, { backgroundColor: theme.primary }, submitting ? styles.disabled : null]}
                        onPress={handleSetAlert}
                        disabled={submitting === true}
                    >
                        <Text style={styles.setButtonText}>{submitting ? '...' : 'Set Alert'}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Active Alerts</Text>
                {alerts.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={[styles.emptyText, { color: theme.textMuted }]}>No active alerts found.</Text>
                    </View>
                ) : (
                    alerts.map(alert => (
                        <View key={alert.id} style={[styles.alertItem, { backgroundColor: theme.card }]}>
                            <View>
                                <Text style={[styles.alertValue, { color: theme.text }]}>1 CAD ≥ {parseFloat(alert.targetRate).toFixed(2)} GHS</Text>
                                <Text style={[styles.alertStatus, { color: theme.textMuted }]}>Notification will be sent once</Text>
                            </View>
                            <TouchableOpacity onPress={() => deleteAlert(alert.id)}>
                                <Text style={[styles.deleteText, { color: '#ef4444' }]}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    header: { padding: 25, paddingTop: 60, backgroundColor: '#1e293b' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 8, lineHeight: 18 },
    card: { backgroundColor: '#1e293b', margin: 20, padding: 20, borderRadius: 16 },
    label: { color: '#818cf8', fontSize: 12, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase' },
    inputContainer: { flexDirection: 'row', gap: 10 },
    input: {
        flex: 1,
        backgroundColor: '#0f172a',
        padding: 15,
        borderRadius: 12,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#334155'
    },
    setButton: { backgroundColor: '#6366f1', paddingHorizontal: 20, borderRadius: 12, justifyContent: 'center' },
    disabled: { opacity: 0.5 },
    setButtonText: { color: '#fff', fontWeight: 'bold' },
    section: { paddingHorizontal: 20, marginTop: 10 },
    sectionTitle: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginBottom: 15, textTransform: 'uppercase' },
    alertItem: {
        backgroundColor: '#1e293b',
        padding: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    alertValue: { color: '#f8fafc', fontSize: 15, fontWeight: 'bold' },
    alertStatus: { color: '#64748b', fontSize: 12, marginTop: 4 },
    deleteText: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
    emptyCard: { padding: 40, alignItems: 'center' },
    emptyText: { color: '#475569', fontSize: 14 }
});

export default RateAlertScreen;
