import { useState, useEffect } from 'react';
import api from '../api/apiService';
import { AuthContext } from './auth-context.js';


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = JSON.parse(atob(token.split('.')[1]));
                if (decodedToken.exp * 1000 < Date.now()) {
                    throw new Error("Token expired");
                }
                setUser({ role: decodedToken.role, id: decodedToken.userId });
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token: newToken } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        const decodedToken = JSON.parse(atob(newToken.split('.')[1]));
        setUser({ role: decodedToken.role, id: decodedToken.userId });
    };

    const register = (username, email, password, role) => {
        return api.post('/auth/register', { username, email, password, role });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const value = { user, token, loading, login, register, logout };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
