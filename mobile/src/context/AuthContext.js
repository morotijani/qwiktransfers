import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotificationsAsync } from '../services/notifications';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAppLocked, setIsAppLocked] = useState(true);
    const [isPickingFile, setIsPickingFile] = useState(false);

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
            } else {
                setIsAppLocked(false); // No session, no lock
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

    const login = async (email, password, otp = null) => {
        const response = await api.post('/auth/login', { email, password, otp });
        
        if (response.data.requires_2fa) {
            return response.data;
        }

        await AsyncStorage.setItem('token', response.data.token);

        const bioEnabled = await AsyncStorage.getItem('biometricEnabled');
        if (bioEnabled === 'true') {
            await AsyncStorage.setItem('biometricToken', response.data.token);
        }

        setUser(response.data.user);
        setIsAppLocked(false); // Unlock upon successful login
        await syncPushToken();
        
        return response.data;
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

    const register = async (userData, options = { autoLogin: false }) => {
        const response = await api.post('/auth/register', userData);

        if (options.autoLogin) {
            await AsyncStorage.setItem('token', response.data.token);
            setUser(response.data.user);
            setIsAppLocked(false);
            await syncPushToken();
        }

        return response.data;
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
        setIsAppLocked(false);
    };

    const verifyAppPin = async (pin) => {
        try {
            await api.post('/auth/verify-pin', { pin: pin.toString() });
            setIsAppLocked(false);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'PIN Verification Failed' };
        }
    };

    const refreshProfile = () => checkAuth();

    const getReferralStats = async () => {
        const response = await api.get('/referrals/stats');
        return response.data;
    };

    const getReferredUsers = async () => {
        const response = await api.get('/referrals/users');
        return response.data;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            login, 
            loginWithBiometrics, 
            register, 
            logout, 
            loading, 
            refreshProfile,
            isAppLocked,
            setIsAppLocked,
            verifyAppPin,
            isPickingFile,
            setIsPickingFile,
            getReferralStats,
            getReferredUsers
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
