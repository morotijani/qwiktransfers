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

    useEffect(() => {
        fetchTransactions();
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

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        setHasMore(true);
        // fetchTransactions will be triggered by page change or mapped if 1
        if (page === 1) fetchTransactions();
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
                        ₵{parseFloat(item.amount_sent).toLocaleString()}
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
                <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>
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
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    headerTitle: {
        fontSize: 24,
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
