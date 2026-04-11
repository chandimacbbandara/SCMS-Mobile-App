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
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.pageWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backToHome}
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.9}
            >
              <Ionicons name="chevron-back" size={16} color="#111827" />
              <Text style={styles.backToHomeText}>Home</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['#ef5350', '#e53935', '#b71c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.brandPanel}
          >
            <View style={styles.panelGlow} />
            <Image source={sideLogo} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.brandTitle}>Welcome Back</Text>
            <Text style={styles.brandSubtitle}>
              Sign in to manage student concerns and track support progress in real time.
            </Text>

            <View style={styles.featureItem}>
              <Ionicons name="paper-plane-outline" size={15} color="#ffffff" />
              <Text style={styles.featureText}>Submit and track concerns</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="chatbubbles-outline" size={15} color="#ffffff" />
              <Text style={styles.featureText}>Get real-time admin replies</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={15} color="#ffffff" />
              <Text style={styles.featureText}>Secure and private portal</Text>
            </View>
          </LinearGradient>

          <View style={styles.formPanel}>
            <Text style={styles.heading}>Sign In</Text>
            <Text style={styles.subHeading}>Enter your credentials to continue</Text>

            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={17} color="#9ca3af" style={styles.inputIcon} />
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

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[styles.input, styles.passwordInput]}
                />
                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.toggleBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#9ca3af"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotWrap}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={17} color="#ffffff" />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inlineRow}>
              <Text style={styles.inlineHint}>Don't have an account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.inlineLink}>Create one</Text>
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
    backgroundColor: '#f5f8fc',
  },
  flexOne: {
    flex: 1,
  },
  pageWrap: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  backToHome: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backToHomeText: {
    marginLeft: 4,
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  brandPanel: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  panelGlow: {
    position: 'absolute',
    right: -34,
    top: -34,
    width: 130,
    height: 130,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  brandLogo: {
    width: 110,
    height: 52,
    marginBottom: 14,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 4,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 5,
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  featureText: {
    marginLeft: 8,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  formPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  heading: {
    fontSize: 28,
    color: '#111827',
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 3,
    marginBottom: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 12,
  },
  errorText: {
    marginLeft: 7,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 6,
    color: '#374151',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    minHeight: 50,
    justifyContent: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 2,
  },
  input: {
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 14,
    color: '#111827',
  },
  passwordInput: {
    paddingRight: 44,
  },
  toggleBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 14,
  },
  forgotText: {
    color: '#c62828',
    fontSize: 13,
    fontWeight: '700',
  },
  loginBtn: {
    borderRadius: 13,
    backgroundColor: '#e53935',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loginBtnText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  inlineRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineHint: {
    color: '#6b7280',
    fontSize: 13,
    marginRight: 6,
  },
  inlineLink: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '800',
  },
  apiHint: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
});
