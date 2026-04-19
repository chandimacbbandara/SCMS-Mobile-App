import React, { useMemo, useState } from 'react';
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

function passwordRules(password) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function allRulesValid(rules) {
  return Object.values(rules).every(Boolean);
}

export default function ForgotPasswordScreen({ navigation }) {
  const { sendForgotCode, verifyForgotCode, resetForgotPassword } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sendStatus, setSendStatus] = useState('');
  const [verifyStatus, setVerifyStatus] = useState('');
  const [resetStatus, setResetStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rules = useMemo(() => passwordRules(newPassword), [newPassword]);
  const passwordsMatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword;

  async function handleSendCode() {
    if (!email.trim()) {
      setErrorMessage('Please enter your email first');
      return;
    }

    setSendLoading(true);
    setErrorMessage('');
    setSendStatus('');
    setVerifyStatus('');
    setResetStatus('');

    try {
      const response = await sendForgotCode(email.trim());
      setSendStatus(response.message || 'Code sent successfully');
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send code');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!code.trim()) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setVerifyLoading(true);
    setErrorMessage('');
    setVerifyStatus('');

    try {
      const response = await verifyForgotCode(email.trim(), code.trim());
      setVerifyStatus(response.message || 'Code verified');
      setStep(3);
    } catch (error) {
      setErrorMessage(error.message || 'Code verification failed');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!allRulesValid(rules)) {
      setErrorMessage('Password does not match security rules');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setResetLoading(true);
    setErrorMessage('');
    setResetStatus('');

    try {
      const response = await resetForgotPassword(email.trim(), newPassword, confirmPassword);
      setResetStatus(response.message || 'Password reset successful');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
    } catch (error) {
      setErrorMessage(error.message || 'Password reset failed');
    } finally {
      setResetLoading(false);
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

            <TouchableOpacity style={styles.navGhostBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.9}>
              <Text style={styles.navGhostText}>Login</Text>
            </TouchableOpacity>
          </View>

          <LinearGradient
            colors={['#ef5350', '#e53935', '#b71c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerCard}
          >
            <Image source={sideLogo} style={styles.brandLogo} resizeMode="contain" />
            <Text style={styles.headerTitle}>Reset Password</Text>
            <Text style={styles.headerSub}>Complete the mobile recovery flow in three quick steps.</Text>
          </LinearGradient>

          <View style={styles.stepperWrap}>
            <View style={styles.stepperRow}>
              <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
              </View>
            </View>
            <Text style={styles.stepperCaption}>Email → Verify code → Set new password</Text>
          </View>

          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={[styles.card, step === 1 && styles.cardActive, step > 1 && styles.cardDone]}>
            <Text style={styles.cardTitle}>Step 1: Send reset code</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                setStep(1);
                setCode('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode} disabled={sendLoading}>
              {sendLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnText}>Send Code</Text>}
            </TouchableOpacity>
            {!!sendStatus && <Text style={styles.okText}>{sendStatus}</Text>}
          </View>

          <View style={[styles.card, step === 2 && styles.cardActive, step > 2 && styles.cardDone, step < 2 && styles.cardLocked]}>
            <Text style={styles.cardTitle}>Step 2: Verify code</Text>
            <TextInput
              style={styles.input}
              value={code}
              onChangeText={setCode}
              placeholder="6-digit verification code"
              keyboardType="numeric"
              maxLength={6}
              editable={step >= 2}
            />
            <TouchableOpacity
              style={[styles.secondaryBtn, step < 2 && styles.disabledBtn]}
              onPress={handleVerifyCode}
              disabled={step < 2 || verifyLoading}
            >
              {verifyLoading ? <ActivityIndicator size="small" color="#111827" /> : <Text style={styles.secondaryBtnText}>Verify Code</Text>}
            </TouchableOpacity>
            {!!verifyStatus && <Text style={styles.okText}>{verifyStatus}</Text>}
          </View>

          <View style={[styles.card, step === 3 && styles.cardActive, step < 3 && styles.cardLocked]}>
            <Text style={styles.cardTitle}>Step 3: Set new password</Text>

            <View style={styles.passwordWrap}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New password"
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                editable={step >= 3}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPassword((value) => !value)}>
                <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordWrap, styles.mt8]}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                editable={step >= 3}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((value) => !value)}>
                <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.rulesWrap}>
              <Text style={[styles.ruleText, rules.length && styles.ruleOk]}>At least 8 characters</Text>
              <Text style={[styles.ruleText, rules.upper && styles.ruleOk]}>At least one uppercase letter</Text>
              <Text style={[styles.ruleText, rules.lower && styles.ruleOk]}>At least one lowercase letter</Text>
              <Text style={[styles.ruleText, rules.number && styles.ruleOk]}>At least one number</Text>
              <Text style={[styles.ruleText, rules.special && styles.ruleOk]}>At least one special character</Text>
              <Text style={[styles.ruleText, passwordsMatch && styles.ruleOk]}>Passwords match</Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, step < 3 && styles.disabledBtn]}
              onPress={handleResetPassword}
              disabled={step < 3 || resetLoading}
            >
              {resetLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
            </TouchableOpacity>

            {!!resetStatus && <Text style={styles.okText}>{resetStatus}</Text>}
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
    justifyContent: 'space-between',
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
  headerCard: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 10,
  },
  brandLogo: {
    width: 98,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  stepperWrap: {
    borderWidth: 1,
    borderColor: '#e4eaf2',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: {
    width: 28,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  stepDotActive: {
    borderColor: '#e53935',
    backgroundColor: '#fff1f1',
  },
  stepDotText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDotTextActive: {
    color: '#b91c1c',
  },
  stepperCaption: {
    marginTop: 7,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
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
  card: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  cardActive: {
    borderColor: '#f3b3b1',
  },
  cardDone: {
    borderColor: '#86efac',
    backgroundColor: '#f7fff9',
  },
  cardLocked: {
    opacity: 0.58,
  },
  cardTitle: {
    color: '#e53935',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: 14,
  },
  passwordWrap: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 42,
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 3,
  },
  mt8: {
    marginTop: 8,
  },
  primaryBtn: {
    marginTop: 9,
    borderRadius: 12,
    backgroundColor: '#e53935',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryBtn: {
    marginTop: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    backgroundColor: '#ffffff',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  okText: {
    marginTop: 7,
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  rulesWrap: {
    marginTop: 10,
    marginBottom: 2,
  },
  ruleText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 3,
  },
  ruleOk: {
    color: '#166534',
    fontWeight: '700',
  },
});
