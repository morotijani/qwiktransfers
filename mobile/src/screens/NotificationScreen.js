import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const NotificationScreen = () => {
    const theme = useTheme();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/system/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.patch(`/system/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error(error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'transaction':
                return 'wallet-outline';
            case 'rate':
                return 'trending-up-outline';
            case 'kyc':
                return 'shield-checkmark-outline';
            default:
                return 'notifications-outline';
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.item,
                { borderBottomColor: theme.border },
                !item.isRead && { backgroundColor: theme.primary + '05' }
            ]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons
                    name={getIcon(item.type)}
                    size={22}
                    color={!item.isRead ? theme.primary : theme.textMuted}
                />
            </View>
            <View style={styles.content}>
                <Text style={[styles.message, { color: theme.text }]} numberOfLines={2}>
                    {item.message}
                </Text>
                <Text style={[styles.date, { color: theme.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
            {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>Activity</Text>
                <TouchableOpacity onPress={fetchNotifications}>
                    <Ionicons name="refresh-outline" size={24} color={theme.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={notifications}
                renderItem={renderItem}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
                        tintColor={theme.primary}
                        colors={[theme.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off-outline" size={64} color={theme.textMuted} style={{ opacity: 0.3 }} />
                        <Text style={[styles.empty, { color: theme.textMuted }]}>No new notifications</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    title: {
        fontSize: 32,
        fontFamily: 'Outfit_700Bold',
    },
    listContent: {
        paddingBottom: 20,
    },
    item: {
        flexDirection: 'row',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        alignItems: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
    },
    content: { flex: 1 },
    message: {
        fontSize: 15,
        fontFamily: 'Outfit_500Medium',
        lineHeight: 20
    },
    date: {
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        marginTop: 4
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginLeft: 12
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    empty: {
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
        fontFamily: 'Outfit_500Medium',
    },
});

export default NotificationScreen;
