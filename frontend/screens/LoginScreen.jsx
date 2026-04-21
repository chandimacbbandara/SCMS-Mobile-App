import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const sideLogo = require('../images/img4.jpeg');

export default function LoginScreen({ navigation }) {
  const { login, apiBaseUrl } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      await login(email.trim(), password);
    } catch (error) {
      setErrorMessage(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.navGhostBtn} onPress={() => navigation.navigate('Home')} activeOpacity={0.9}>
              <Ionicons name="chevron-back" size={16} color="#111827" />
              <Text style={styles.navGhostText}>Back</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['#ef5350', '#e53935', '#b71c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandCard}
          >
            <Image source={sideLogo} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandTitle}>Welcome Back</Text>
            <Text style={styles.brandSub}>Sign in and continue managing student concerns on mobile.</Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Sign In</Text>
            <Text style={styles.formSub}>Use your student, admin, consulter, or owner account credentials</Text>

            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.inlineLinkWrap} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.inlineLink}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.9}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={17} color="#ffffff" />
                  <Text style={styles.primaryBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomHint}>New student?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.bottomLink}>Create account</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.apiHint}>API: {apiBaseUrl}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fc',
  },
  flexOne: {
    flex: 1,
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  navGhostBtn: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navGhostText: {
    marginLeft: 4,
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  brandCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  brandLogo: {
    width: 98,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 4,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  formTitle: {
    color: '#111827',
    fontSize: 27,
    fontWeight: '900',
  },
  formSub: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 12,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  errorText: {
    marginLeft: 6,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    minHeight: 50,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  input: {
    color: '#111827',
    fontSize: 14,
    paddingLeft: 40,
    paddingRight: 12,
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeBtn: {
    position: 'absolute',
    right: 11,
    padding: 5,
  },
  inlineLinkWrap: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  inlineLink: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryBtn: {
    borderRadius: 12,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: '#e53935',
  },
  primaryBtnText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomHint: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 5,
  },
  bottomLink: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '800',
  },
  apiHint: {
    marginTop: 10,
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
});
