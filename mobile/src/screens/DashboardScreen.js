import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Image,
    Platform,
    StatusBar,
    Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api, { getImageUrl } from '../services/api';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';
import Ionicons from '@expo/vector-icons/Ionicons';
import TransactionCard from '../components/TransactionCard';
import TransactionChart from '../components/TransactionChart';
import GlobalNotice from '../components/GlobalNotice';

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

    const [rate, setRate] = useState(null);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    useEffect(() => {
        loadCachedData();
        fetchRate();
    }, []);

    const fetchRate = async () => {
        try {
            const response = await api.get('/rates');
            const rawRate = response.data.rate;
            const displayRate = rawRate < 1 ? (1 / rawRate) : rawRate;
            setRate(displayRate.toFixed(2));
        } catch (error) {
            console.log('Failed to fetch rate', error);
        }
    };

    const loadCachedData = async () => {
        try {
            const cachedTxs = await AsyncStorage.getItem('cachedTransactions');
            const cachedTotal = await AsyncStorage.getItem('cachedTotalSent');
            if (cachedTxs) {
                setTransactions(JSON.parse(cachedTxs));
            }
            if (cachedTotal) {
                setTotalSent(parseFloat(cachedTotal));
            }
        } catch (e) {
            console.error('Failed to load cache:', e);
        }
    };

    const fetchData = async () => {
        // Only show loading shimmer if we don't have cached data
        if (transactions.length === 0) {
            setLoading(true);
        }
        await Promise.all([
            fetchTransactions(),
            fetchAnalytics(),
            refreshProfile?.()
        ]);
        setLoading(false);
    };

    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await api.get('/transactions/user/stats');
            setAnalyticsData(res.data);
            AsyncStorage.setItem('cachedAnalytics', JSON.stringify(res.data));
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            // Load from cache if offline
            const cached = await AsyncStorage.getItem('cachedAnalytics');
            if (cached) setAnalyticsData(JSON.parse(cached));
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions');
            const txs = res.data.transactions || res.data; // Handle different API response shapes
            setTransactions(txs);
            // Save to cache for offline mode
            AsyncStorage.setItem('cachedTransactions', JSON.stringify(txs));
        } catch (error) {
            console.error('Fetch Error:', error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    const insets = useSafeAreaInsets();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning ☀️';
        if (hour < 17) return 'Good afternoon 🌤️';
        return 'Good evening 🌙';
    };

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar backgroundColor="transparent" translucent={true} barStyle={theme.isDark ? "light-content" : "dark-content"} />
            <View style={[styles.heroSection, { backgroundColor: theme.primary + '08', paddingTop: insets.top + 15 }]}>
                <View style={styles.heroTop}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Profile')}
                        style={styles.heroAvatarContainer}
                    >
                        {user?.profile_picture ? (
                            <Image
                                source={{ uri: getImageUrl(user.profile_picture) }}
                                style={styles.heroAvatarImage}
                            />
                        ) : (
                            <View style={[styles.heroAvatarPlaceholder, { backgroundColor: theme.primary + '20' }]}>
                                <Text style={[styles.heroAvatarText, { color: theme.primary }]}>
                                    {(user?.full_name || user?.firstName || 'U').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <View style={styles.heroGreeting}>
                        <Text style={[styles.heroGreetingText, { color: theme.textMuted }]}>{getGreeting()}</Text>
                        <Text style={[styles.heroNameText, { color: theme.text }]}>
                            {(user?.full_name || user?.firstName || 'User').split(' ')[0]}
                        </Text>
                    </View>
                    <View style={styles.heroHeaderActions}>
                        {rate && (
                            <View style={[styles.heroRateBadge, { backgroundColor: theme.primary + '15' }]}>
                                <Text style={[styles.heroRateBadgeText, { color: theme.primary }]}>1 CAD = {rate} GHS</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => navigation.navigate('Alerts')} style={[styles.notificationBtn, { backgroundColor: theme.card }]}>
                            <Ionicons name="notifications-outline" size={24} color={theme.text} />
                            <View style={[styles.notificationDot, { borderColor: theme.card }]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Balance Section */}
                <View style={styles.balanceSection}>
                    <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>Total Sent</Text>
                    <View style={styles.balanceRow}>
                        <Text style={[styles.balanceValue, { color: theme.text }]}>
                            {loading && transactions.length === 0 ? (
                                <ShimmerPlaceholder duration={800} style={{ width: 150, height: 36, borderRadius: 8 }} />
                            ) : (
                                (user?.country?.toLowerCase() === 'canada')
                                    ? `$${parseFloat(analyticsData?.totalSentCAD || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : `₵${parseFloat(analyticsData?.totalSentGHS || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            )}
                        </Text>
                        <TouchableOpacity style={[styles.statsBtn, { backgroundColor: theme.primary + '10' }]}>
                            <Ionicons name="trending-up" size={20} color={theme.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.actionGrid}>
                    <ActionButton icon="arrow-up" label="Send" onPress={() => navigation.navigate('Transfer')} theme={theme} color={theme.primary} />
                    <ActionButton icon="swap-horizontal" label="Rates" onPress={() => navigation.navigate('Watcher')} theme={theme} color={theme.primary} />
                    <ActionButton icon="gift-outline" label="Reward" onPress={() => navigation.navigate('Referral')} theme={theme} color={theme.primary} />
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
                <GlobalNotice />
                {/* Transaction Analytics Chart */}
                <TransactionChart
                    data={analyticsData}
                    loading={analyticsLoading}
                />

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
                            <View key={i} style={[styles.txRowShimmer, { borderBottomColor: theme.border }]}>
                                <ShimmerPlaceholder style={styles.txIconShimmer} />
                                <View style={styles.txInfoShimmer}>
                                    <View style={styles.txMainShimmer}>
                                        <ShimmerPlaceholder style={{ width: 140, height: 16, borderRadius: 4 }} />
                                        <ShimmerPlaceholder style={{ width: 80, height: 16, borderRadius: 4 }} />
                                    </View>
                                    <View style={styles.txSubShimmer}>
                                        <ShimmerPlaceholder style={{ width: 100, height: 12, borderRadius: 3 }} />
                                        <ShimmerPlaceholder style={{ width: 60, height: 12, borderRadius: 3 }} />
                                    </View>
                                </View>
                            </View>
                        ))
                    ) : transactions.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No activity found</Text>
                        </View>
                    ) : (
                        transactions.map((tx) => (
                            <TransactionCard
                                key={tx.transaction_id || tx.id}
                                tx={tx}
                                theme={theme}
                                onPress={(tx) => navigation.navigate('TransactionDetails', {
                                    transactionId: tx.transaction_id || tx.id,
                                    initialData: tx
                                })}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    heroSection: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    heroTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    heroAvatarContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#fff',
    },
    heroAvatarImage: {
        width: '100%',
        height: '100%',
    },
    heroAvatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroAvatarText: {
        fontSize: 18,
        fontFamily: 'Outfit_700Bold',
    },
    heroGreeting: {
        flex: 1,
        marginLeft: 12,
    },
    heroGreetingText: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
    },
    heroNameText: {
        fontSize: 18,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    heroHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    heroRateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    heroRateBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        fontFamily: 'Outfit_700Bold',
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        borderWidth: 1.5,
    },
    balanceSection: {
        marginBottom: 25,
    },
    balanceLabel: {
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'Outfit_600SemiBold',
        marginBottom: 4,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    balanceValue: {
        fontSize: 34,
        fontWeight: '700',
        letterSpacing: -1,
        fontFamily: 'Outfit_700Bold',
    },
    statsBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 0, // Adjusted for full width within heroSection
    },
    actionItem: {
        alignItems: 'center',
        flex: 1,
    },
    actionIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    actionLabel: {
        fontSize: 13,
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
    },
    txRowShimmer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    txInfoShimmer: {
        flex: 1,
    },
    txMainShimmer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    txSubShimmer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});

export default DashboardScreen;
