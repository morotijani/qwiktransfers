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
    Platform,
    StatusBar,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import Ionicons from '@expo/vector-icons/Ionicons';

const ActionButton = ({ icon, label, onPress, theme, color }) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
        <View style={[styles.actionIconContainer, { backgroundColor: color || theme.primary }]}>
            <Ionicons name={icon} size={22} color="white" />
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
            <View style={styles.appHeader}>
                <TouchableOpacity>
                    <Ionicons name="menu-outline" size={28} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.giftButton, { backgroundColor: theme.primary + '15' }]}>
                        <Text style={[styles.giftText, { color: theme.primary }]}>Get $10</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Ionicons name="notifications-outline" size={26} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

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
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={[styles.portfolioLabel, { color: theme.textMuted }]}>Total Sent</Text>
                            <Text style={[styles.portfolioValue, { color: theme.text }]}>
                                ₵{totalSent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Text>
                        </View>
                        <View style={styles.sparklineContainer}>
                            <Ionicons name="stats-chart" size={44} color={theme.primary} style={{ opacity: 0.8 }} />
                        </View>
                    </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionGrid}>
                    {/* <ActionButton icon="add" label="Buy" onPress={() => navigation.navigate('Transfer')} theme={theme} color={theme.primary} />
                    <ActionButton icon="remove" label="Sell" onPress={() => { }} theme={theme} color={theme.primary} /> */}
                    <ActionButton icon="arrow-up" label="Send" onPress={() => navigation.navigate('Transfer')} theme={theme} color={theme.primary} />
                    <ActionButton icon="arrow-down" label="Receive" onPress={() => { }} theme={theme} color={theme.primary} />
                    <ActionButton icon="swap-horizontal" label="Rate" onPress={() => { }} theme={theme} color={theme.primary} />
                    <ActionButton icon="shield-half-outline" label="KYC" onPress={() => { }} theme={theme} color={theme.primary} />
                </View>

                {/* Verification / Limits Card */}
                <TouchableOpacity
                    style={[styles.verificationCard, { backgroundColor: theme.card }]}
                    onPress={() => navigation.navigate('KYC')}
                >
                    <View style={styles.verifContent}>
                        <Text style={[styles.verifTitle, { color: theme.text }]}>
                            {user?.kyc_status === 'verified' ? 'Higher limits unlocked' : 'Increase your daily limit'}
                        </Text>
                        <Text style={[styles.verifSubtitle, { color: theme.textMuted }]}>
                            {user?.kyc_status === 'verified'
                                ? 'You can now send up to $50,000 daily'
                                : 'Complete Level 2 verification to send more'}
                        </Text>

                        <View style={styles.progressContainer}>
                            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                                <View style={[
                                    styles.progressFill,
                                    {
                                        backgroundColor: theme.primary,
                                        width: user?.kyc_status === 'verified' ? '100%' : '30%'
                                    }
                                ]} />
                            </View>
                            <Text style={[styles.progressText, { color: theme.textMuted }]}>
                                {user?.kyc_status === 'verified' ? 'Level 2 Verified' : 'Level 1: $1,000 limit'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.verifImageContainer}>
                        <View style={[styles.verifCircle, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name={user?.kyc_status === 'verified' ? "checkmark-circle" : "shield-checkmark"} size={32} color={theme.primary} />
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Transactions Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Transactions')}>
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
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No activity found</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <TouchableOpacity
                                key={tx.transaction_id || tx.id}
                                style={[styles.txRow, { borderBottomColor: theme.border }]}
                                onPress={() => navigation.navigate('TransactionDetails', {
                                    transactionId: tx.transaction_id || tx.id,
                                    initialData: tx
                                })}
                            >
                                <View style={[styles.txIconContainer, { backgroundColor: theme.isDark ? '#292524' : theme.primary + '10' }]}>
                                    <Ionicons
                                        name={tx.recipient_details?.type === 'bank' ? 'business' : 'phone-portrait'}
                                        size={20}
                                        color={theme.primary}
                                    />
                                </View>
                                <View style={styles.txInfo}>
                                    <View style={styles.txMain}>
                                        <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                                            {tx.recipient_details?.name}
                                        </Text>
                                        <Text style={[styles.txAmountLarge, { color: theme.text }]}>
                                            ₵{parseFloat(tx.amount_sent).toLocaleString()}
                                        </Text>
                                    </View>
                                    <View style={styles.txSub}>
                                        <Text style={[styles.txSubtitle, { color: theme.textMuted }]}>
                                            {tx.transaction_id || 'Ref Code'} • {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </Text>
                                        <Text style={[styles.txDetail, { color: getStatusColor(tx.status) }]}>
                                            {tx.status === 'sent' ? '↘ 0.00%' : tx.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    appHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    giftButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    giftText: {
        fontSize: 13,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    portfolioHeader: {
        paddingTop: 20,
        paddingBottom: 25,
        paddingHorizontal: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    portfolioLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
        fontFamily: 'Outfit_600SemiBold',
    },
    portfolioValue: {
        fontSize: 36,
        fontWeight: '700',
        letterSpacing: -1,
        fontFamily: 'Outfit_700Bold',
    },
    sparklineContainer: {
        width: 100,
        height: 60,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginBottom: 30,
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: "red", // Or remove shadow color logic to let it inherit or use theme if needed, but 'red' is safer generic if theme not in scope of styles
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    actionLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    verificationCard: {
        marginHorizontal: 16,
        padding: 20,
        borderRadius: 20,
        marginBottom: 30,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    verifContent: {
        flex: 1,
    },
    verifTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 6,
        fontFamily: 'Outfit_700Bold',
    },
    verifSubtitle: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 18,
        marginBottom: 12,
        fontFamily: 'Outfit_400Regular',
    },
    progressContainer: {
        marginTop: 4,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        width: '85%',
        marginBottom: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
    },
    progressText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontFamily: 'Outfit_700Bold',
    },
    verifImageContainer: {
        marginLeft: 15,
    },
    verifCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    seeAll: {
        fontSize: 15,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    listContainer: {
        paddingBottom: 40,
    },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
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
    txInfo: {
        flex: 1,
    },
    txMain: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    txTitle: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
        fontFamily: 'Outfit_600SemiBold',
    },
    txAmountLarge: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
        fontFamily: 'Outfit_600SemiBold',
    },
    txSub: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txSubtitle: {
        fontSize: 13,
        fontWeight: '400',
        fontFamily: 'Outfit_400Regular',
    },
    txDetail: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
    },
    txIconShimmer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: 16,
    }
});

export default DashboardScreen;
