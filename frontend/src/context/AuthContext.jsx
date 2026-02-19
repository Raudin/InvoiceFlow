import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data.data);
        } catch (error) {
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', response.data.data.token);
        const userData = response.data.data.user;
        setUser(userData);
        return response.data;
    };

    const register = async (data) => {
        const response = await api.post('/auth/register', data);
        localStorage.setItem('token', response.data.data.token);
        const userData = response.data.data.user;
        setUser(userData);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'admin';
    const isCustomer = user?.role === 'customer';

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin, isCustomer }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
