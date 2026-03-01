import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../services/notifications';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                const response = await api.get('/auth/profile');
                setUser(response.data);
                await syncPushToken();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await AsyncStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const syncPushToken = async () => {
        try {
            const pushToken = await registerForPushNotificationsAsync();
            if (pushToken) {
                await api.post('/auth/push-token', { token: pushToken });
            }
        } catch (error) {
            console.error('Failed to sync push token with backend:', error);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        await AsyncStorage.setItem('token', response.data.token);

        const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (bioEnabled === 'true') {
            await AsyncStorage.setItem('biometricToken', response.data.token);
        }

        setUser(response.data.user);
        await syncPushToken();
    };

    const loginWithBiometrics = async () => {
        const bioToken = await AsyncStorage.getItem('biometricToken');
        if (bioToken) {
            await AsyncStorage.setItem('token', bioToken);
            await checkAuth();
            return true;
        }
        return false;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        await AsyncStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        await syncPushToken();
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    const refreshProfile = () => checkAuth();

    return (
        <AuthContext.Provider value={{ user, login, loginWithBiometrics, register, logout, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
