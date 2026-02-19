import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator
} from 'react-native';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import ShimmerPlaceholder from '../components/ShimmerPlaceholder';

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

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.item, (!item.isRead === true) ? { backgroundColor: theme.isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)' } : null, { borderBottomColor: theme.border }]}
            onPress={() => markAsRead(item.id)}
        >
            <View style={[styles.iconContainer, { backgroundColor: theme.card }]}>
                <Text style={styles.icon}>{item.type === 'transaction' ? '💰' : '📢'}</Text>
            </View>
            <View style={styles.content}>
                <Text style={[styles.message, { color: theme.text }]}>{item.message}</Text>
                <Text style={[styles.date, { color: theme.textMuted }]}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
            {(item.isRead === false) ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} animating={true} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.card }]}>
                <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
            </View>
            {loading && notifications.length === 0 ? (
                <View style={{ padding: 20 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <View key={i} style={{ flexDirection: 'row', marginBottom: 20, alignItems: 'center' }}>
                            <ShimmerPlaceholder style={{ width: 45, height: 45, borderRadius: 22.5, marginRight: 15 }} />
                            <View style={{ flex: 1 }}>
                                <ShimmerPlaceholder style={{ width: '70%', height: 14, marginBottom: 8 }} />
                                <ShimmerPlaceholder style={{ width: '40%', height: 10 }} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing === true}
                            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
                            tintColor={theme.primary}
                            enabled={true}
                        />
                    }
                    ListEmptyComponent={<Text style={[styles.empty, { color: theme.textMuted }]}>No new notifications</Text>}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f172a' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
    header: { padding: 25, paddingTop: 60, backgroundColor: '#1e293b' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    item: {
        flexDirection: 'row',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
        alignItems: 'center',
    },
    unreadItem: { backgroundColor: 'rgba(99, 102, 241, 0.05)' },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    icon: { fontSize: 20 },
    content: { flex: 1 },
    message: { color: '#f8fafc', fontSize: 14, lineHeight: 20 },
    date: { color: '#64748b', fontSize: 11, marginTop: 5 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366f1', marginLeft: 10 },
    empty: { textAlign: 'center', color: '#64748b', marginTop: 50, fontSize: 16 },
});

export default NotificationScreen;
