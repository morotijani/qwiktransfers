import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    RefreshControl,
    Image,
    SafeAreaView,
    StatusBar,
    Modal
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

const ActionButton = ({ icon, label, onPress, theme }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
        <View style={[styles.actionIconContainer, { backgroundColor: theme.primary }]}>
            <Text style={styles.actionIcon}>{icon}</Text>
        </View>
        <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
);

const DashboardScreen = ({ navigation }) => {
    const { user, logout, refreshProfile } = useAuth();
    const theme = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [totalSent, setTotalSent] = useState(0);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchTransactions(), refreshProfile?.()]);
        setLoading(false);
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions');
            const txs = res.data.transactions || res.data; // Handle different API response shapes
            setTransactions(txs);

            // Calculate total sent (GHS converted to CAD for a single master number if needed, 
            // but for Hawala we often just show a primary currency total)
            const total = txs
                .filter(tx => tx.status === 'sent')
                .reduce((acc, tx) => acc + parseFloat(tx.amount_sent), 0);
            setTotalSent(total);
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sent': return '#10b981';
            case 'processing': return '#f59e0b';
            case 'pending': return '#6366f1';
            case 'cancelled': return '#ef4444';
            default: return '#6b7280';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing === true}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                        enabled={true}
                    />
                }
            >
                {/* Coinbase-style Portfolio Header */}
                <View style={styles.portfolioHeader}>
                    <Text style={[styles.portfolioLabel, { color: theme.textMuted }]}>Total Sent (GHS)</Text>
                    <Text style={[styles.portfolioValue, { color: theme.text }]}>
                        ₵{totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                    <View style={styles.changeBadge}>
                        <Text style={styles.changeText}>Global Fintech Solutions</Text>
                    </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionGrid}>
                    <ActionButton icon="↑" label="Send" onPress={() => navigation.navigate('Transfer')} theme={theme} />
                    <ActionButton icon="↓" label="Receive" onPress={() => { }} theme={theme} />
                    <ActionButton icon="⇄" label="Rates" onPress={() => { }} theme={theme} />
                    <ActionButton icon="👤" label="KYC" onPress={() => { }} theme={theme} />
                </View>

                {/* Performance / Rate Ticker Strip */}
                <View style={[styles.tickerCard, { backgroundColor: theme.card }]}>
                    <View style={styles.tickerItem}>
                        <Text style={[styles.tickerLabel, { color: theme.textMuted }]}>GHS / CAD</Text>
                        <Text style={[styles.tickerValue, { color: '#10b981' }]}>1 GHS = 0.0904 CAD</Text>
                    </View>
                </View>

                {/* Transactions Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
                    <TouchableOpacity>
                        <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.listContainer}>
                    {loading && transactions.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <View key={i} style={[styles.txRow, { borderBottomColor: theme.border }]}>
                                <ShimmerPlaceholder style={styles.txIconShimmer} />
                                <View style={styles.txInfo}>
                                    <ShimmerPlaceholder style={{ width: 120, height: 16, marginBottom: 6 }} />
                                    <ShimmerPlaceholder style={{ width: 80, height: 12 }} />
                                </View>
                            </View>
                        ))
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <View key={tx.id} style={[styles.txRow, { borderBottomColor: theme.border }]}>
                                <View style={[styles.txIconContainer, { backgroundColor: theme.isDark ? '#1e293b' : '#f1f5f9' }]}>
                                    <Text style={styles.txIconLetter}>
                                        {tx.recipient_details?.name?.charAt(0) || 'R'}
                                    </Text>
                                </View>
                                <View style={styles.txInfo}>
                                    <View style={styles.txMain}>
                                        <Text style={[styles.txName, { color: theme.text }]} numberOfLines={1}>
                                            {tx.recipient_details?.name}
                                        </Text>
                                        <Text style={[styles.txAmount, { color: theme.text }]}>
                                            -{tx.amount_sent} {tx.type?.split('-')[0]}
                                        </Text>
                                    </View>
                                    <View style={styles.txSub}>
                                        <Text style={[styles.txDate, { color: theme.textMuted }]}>
                                            {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(tx.status) }]} />
                                        <Text style={[styles.txStatus, { color: getStatusColor(tx.status) }]}>
                                            {tx.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    portfolioHeader: {
        paddingTop: 40,
        paddingBottom: 30,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    portfolioLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    portfolioValue: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -1,
    },
    changeBadge: {
        marginTop: 12,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    changeText: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '700',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    actionIcon: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    tickerCard: {
        marginHorizontal: 24,
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tickerLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginRight: 8,
    },
    tickerValue: {
        fontSize: 13,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    seeAll: {
        fontSize: 14,
        fontWeight: '700',
    },
    listContainer: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    txIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    txIconLetter: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6366f1',
    },
    txInfo: {
        flex: 1,
    },
    txMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    txName: {
        fontSize: 16,
        fontWeight: '700',
        flex: 1,
    },
    txAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 12,
    },
    txSub: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    txDate: {
        fontSize: 13,
        fontWeight: '500',
        marginRight: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    txStatus: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '500',
    },
    txIconShimmer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
    }
});

export default DashboardScreen;
