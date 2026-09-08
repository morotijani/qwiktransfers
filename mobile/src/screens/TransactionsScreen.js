import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
    RefreshControl,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

const TransactionsScreen = ({ navigation }) => {
    const theme = useTheme();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [stats, setStats] = useState({ totalSentGHS: 0, totalSentCAD: 0, totalSentCount: 0 });
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        fetchTransactions();
        if (page === 1) fetchStats();
    }, [page]);

    const fetchTransactions = async () => {
        try {
            // Append page param if API supports it, otherwise just get all
            const res = await api.get(`/transactions?page=${page}`);
            const newTxs = res.data.transactions || res.data;

            if (page === 1) {
                setTransactions(newTxs);
            } else {
                setTransactions(prev => [...prev, ...newTxs]);
            }

            // Simple check for pagination end
            if (newTxs.length < 10) setHasMore(false);

        } catch (error) {
            console.error('Fetch Error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/transactions/user/stats');
            setStats(res.data);
        } catch (error) {
            console.error('Stats Error:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        fetchStats();
        if (page === 1) fetchTransactions();
    };

    const handleExport = async () => {
        if (exporting) return;
        setExporting(true);
        try {
            const res = await api.get('/transactions/export');
            const csvData = res.data;
            const filename = `Transactions_${new Date().getTime()}.csv`;
            const fileUri = FileSystem.cacheDirectory + filename;

            await FileSystem.writeAsStringAsync(fileUri, csvData, {
                encoding: 'utf8',
            });

            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Transaction History',
                UTI: 'public.comma-separated-values-text',
            });
        } catch (error) {
            console.error('Export Error:', error);
            // We use standard console error or could use a toast if available
        } finally {
            setExporting(false);
        }
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

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.txRow, { borderBottomColor: theme.border }]}
            onPress={() => navigation.navigate('TransactionDetails', {
                transactionId: item.transaction_id || item.id,
                initialData: item
            })}
        >
            <View style={[styles.txIconContainer, { backgroundColor: theme.isDark ? '#292524' : theme.primary + '10' }]}>
                <Ionicons
                    name={item.recipient_details?.type === 'bank' ? 'business' : 'phone-portrait'}
                    size={20}
                    color={theme.primary}
                />
            </View>
            <View style={styles.txInfo}>
                <View style={styles.txMain}>
                    <Text style={[styles.txTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.recipient_details?.name || 'Unknown Recipient'}
                    </Text>
                    <Text style={[styles.txAmountLarge, { color: theme.text }]}>
                        {item.type?.split('-')[0] === 'CAD' ? '$' : '₵'}{parseFloat(item.amount_sent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Text>
                </View>
                <View style={styles.txSub}>
                    <Text style={[styles.txSubtitle, { color: theme.textMuted }]}>
                        {item.transaction_id || 'Ref Code'} • {new Date(item.created_at || item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                    <Text style={[styles.txDetail, { color: getStatusColor(item.status) }]}>
                        {item.status.toUpperCase()}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
                <TouchableOpacity onPress={handleExport} style={styles.exportBtn} disabled={exporting}>
                    {exporting ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                        <Ionicons name="download-outline" size={24} color={theme.text} />
                    )}
                </TouchableOpacity>
            </View>

            {loading && page === 1 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={item => (item.transaction_id || item.id).toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    // ListHeaderComponent={
                    //     <View style={styles.statsContainer}>
                    //         <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    //             <View style={[styles.statIcon, { backgroundColor: '#ffcc0020' }]}>
                    //                 <Text style={{ fontSize: 18 }}>🇬🇭</Text>
                    //             </View>
                    //             <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Sent (GHS)</Text>
                    //             <Text style={[styles.statValue, { color: theme.text }]}>
                    //                 ₵{parseFloat(stats.totalSentGHS || 0).toLocaleString()}
                    //             </Text>
                    //         </View>
                    //         <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    //             <View style={[styles.statIcon, { backgroundColor: '#ff000020' }]}>
                    //                 <Text style={{ fontSize: 18 }}>🇨🇦</Text>
                    //             </View>
                    //             <Text style={[styles.statLabel, { color: theme.textMuted }]}>Total Sent (CAD)</Text>
                    //             <Text style={[styles.statValue, { color: theme.text }]}>
                    //                 ${parseFloat(stats.totalSentCAD || 0).toLocaleString()}
                    //             </Text>
                    //         </View>
                    //     </View>
                    // }
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No transactions yet.</Text>
                        </View>
                    }
                    onEndReached={() => {
                        if (hasMore && !loading) setPage(p => p + 1);
                    }}
                    onEndReachedThreshold={0.5}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        height: 60,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
        flex: 1,
        textAlign: 'center'
    },
    exportBtn: { padding: 8 },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        gap: 12
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Outfit_500Medium',
        marginBottom: 4
    },
    statValue: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    txRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
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
        fontFamily: 'Outfit_600SemiBold',
        flex: 1,
    },
    txAmountLarge: {
        fontSize: 16,
        fontFamily: 'Outfit_600SemiBold',
        marginLeft: 12,
    },
    txSub: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    txSubtitle: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    txDetail: {
        fontSize: 12,
        fontFamily: 'Outfit_700Bold',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    }
});

export default TransactionsScreen;
