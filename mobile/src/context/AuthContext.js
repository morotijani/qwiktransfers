import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            await AsyncStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        await AsyncStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        await AsyncStorage.setItem('token', response.data.token);
        setUser(response.data.user);
    };

    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    const refreshProfile = () => checkAuth();

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
