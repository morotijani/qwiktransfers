import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';

const getStatusColor = (status) => {
    switch (status) {
        case 'sent': return '#10b981';
        case 'processing': return '#f59e0b';
        case 'pending': return '#6366f1';
        case 'cancelled': return '#ef4444';
        default: return '#6b7280';
    }
};

const TransactionCard = ({ tx, theme, onPress }) => {
    const handlePress = () => {
        Haptics.selectionAsync();
        if (onPress) onPress(tx);
    };

    return (
        <TouchableOpacity
            style={[styles.txRow, { borderBottomColor: theme.border }]}
            onPress={handlePress}
            activeOpacity={0.7}
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
                        {tx.recipient_details?.name || 'Unknown Recipient'}
                    </Text>
                    <Text style={[styles.txAmountLarge, { color: theme.text }]}>
                        ₵{parseFloat(tx.amount_sent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
    );
};

const styles = StyleSheet.create({
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
});

export default TransactionCard;
