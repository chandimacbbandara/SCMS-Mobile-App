import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getApiBaseUrl } from '../lib/api'; // Remove duplicate import

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

  // ✅ REGISTER FUNCTION WITH ALL FIELDS (Age, GPA, Year, Gender)
  async function register(payload, photoFile) {
    const formData = new FormData();

    // Add all text fields from payload
    Object.entries(payload).forEach(([key, value]) => {
      // Don't append null or undefined values
      if (value !== null && value !== undefined && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // Ensure age, gpa, year, gender are explicitly included
    if (payload.age) formData.append('age', payload.age.toString());
    if (payload.gpa) formData.append('gpa', payload.gpa.toString());
    if (payload.year) formData.append('year', payload.year.toString());
    if (payload.gender) formData.append('gender', payload.gender);

    // Add student ID photo if provided
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

  // ✅ UPDATE STUDENT PROFILE FUNCTION
  async function updateStudentProfile(profileData) {
    if (!token) {
      throw new Error('No authentication token');
    }

    const response = await apiRequest('/students/profile', {
      method: 'PUT',
      body: profileData,
      token,
    });

    // Update the stored user data
    if (response.data) {
      const updatedUser = { ...user, ...response.data };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }

    return response;
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
      updateStudentProfile,
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