import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const GlobalNotice = () => {
    const theme = useTheme();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await api.get('/announcements');
            setNotices(res.data);
        } catch (error) {
            console.error('Failed to fetch global notices', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = async (id) => {
        try {
            await api.post(`/announcements/${id}/dismiss`);
            setNotices(notices.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to dismiss notice', error);
        }
    };

    if (loading || notices.length === 0) return null;

    return (
        <View style={styles.container}>
            {notices.map((notice) => {
                let iconName = 'megaphone-outline';
                let iconColor = '#1890ff';
                let bgColor = '#e6f7ff';
                let textColor = '#003a8c';
                let borderColor = '#1890ff';

                if (notice.type === 'urgent') {
                    iconName = 'warning';
                    iconColor = '#ff4d4f';
                    bgColor = '#fff1f0';
                    textColor = '#820014';
                    borderColor = '#ff4d4f';
                } else if (notice.type === 'warning') {
                    iconName = 'alert-circle';
                    iconColor = '#faad14';
                    bgColor = '#fffbe6';
                    textColor = '#874d00';
                    borderColor = '#faad14';
                } else if (notice.type === 'success') {
                    iconName = 'checkmark-circle';
                    iconColor = '#52c41a';
                    bgColor = '#f6ffed';
                    textColor = '#135200';
                    borderColor = '#52c41a';
                }

                return (
                    <Animated.View 
                        key={notice.id} 
                        style={[
                            styles.noticeBanner, 
                            { backgroundColor: bgColor, borderLeftColor: borderColor, borderLeftWidth: 4 }
                        ]}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: iconColor }]}>
                            <Ionicons name={iconName} size={20} color="#fff" />
                        </View>
                        
                        <View style={styles.content}>
                            <Text style={[styles.title, { color: textColor }]}>{notice.title}</Text>
                            <Text style={[styles.message, { color: theme.isDark ? '#333' : 'rgba(0,0,0,0.65)' }]}>{notice.message}</Text>
                        </View>

                        <TouchableOpacity 
                            style={styles.closeBtn} 
                            onPress={() => handleDismiss(notice.id)}
                            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        >
                            <Ionicons name="close" size={20} color="rgba(0,0,0,0.4)" />
                        </TouchableOpacity>
                    </Animated.View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    noticeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontFamily: 'Outfit_700Bold',
        marginBottom: 2,
    },
    message: {
        fontSize: 12,
        fontFamily: 'Outfit_400Regular',
        lineHeight: 16,
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    }
});

export default GlobalNotice;
