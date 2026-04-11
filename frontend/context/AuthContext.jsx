import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getApiBaseUrl } from '../lib/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'scms_auth_token';
const USER_KEY = 'scms_auth_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        setToken(null);
        setUser(null);
      } finally {
        setInitializing(false);
      }
    }

    bootstrap();
  }, []);

  async function persistSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);

    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }

  async function clearSession() {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }

  async function login(email, password) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    await persistSession(response.token, response.user);
    return response;
  }

  async function sendRegisterCode(email, firstName) {
    return apiRequest('/auth/register/send-code', {
      method: 'POST',
      body: { email, firstName },
    });
  }

  async function verifyRegisterCode(email, code) {
    return apiRequest('/auth/register/verify-code', {
      method: 'POST',
      body: { email, code },
    });
  }

  async function register(payload, photoFile) {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (photoFile?.uri) {
      formData.append('studentIdPhoto', {
        uri: photoFile.uri,
        name: photoFile.fileName || `student-photo-${Date.now()}.jpg`,
        type: photoFile.mimeType || 'image/jpeg',
      });
    }

    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });

    await persistSession(response.token, response.user);
    return response;
  }

  async function sendForgotCode(email) {
    return apiRequest('/auth/forgot-password/send-code', {
      method: 'POST',
      body: { email },
    });
  }

  async function verifyForgotCode(email, code) {
    return apiRequest('/auth/forgot-password/verify-code', {
      method: 'POST',
      body: { email, code },
    });
  }

  async function resetForgotPassword(email, newPassword, confirmPassword) {
    return apiRequest('/auth/forgot-password/reset', {
      method: 'POST',
      body: { email, newPassword, confirmPassword },
    });
  }

  async function refreshMe() {
    if (!token) {
      return null;
    }

    const response = await apiRequest('/auth/me', {
      method: 'GET',
      token,
    });

    setUser(response.user);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  }

  const value = useMemo(
    () => ({
      token,
      user,
      initializing,
      apiBaseUrl: getApiBaseUrl(),
      isAuthenticated: Boolean(token),
      login,
      register,
      logout: clearSession,
      sendRegisterCode,
      verifyRegisterCode,
      sendForgotCode,
      verifyForgotCode,
      resetForgotPassword,
      refreshMe,
    }),
    [token, user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
