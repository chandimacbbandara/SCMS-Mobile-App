import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
  const [devCode, setDevCode] = useState('');

  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
      setDevCode(response.devCode || '');
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send code');
      setDevCode('');
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
      <ScrollView contentContainerStyle={styles.pageWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.9}
          >
            <Ionicons name="chevron-back" size={16} color="#111827" />
            <Text style={styles.navBtnText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
          >
            <Text style={[styles.navBtnText, styles.navBtnDarkText]}>Login</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#ef5350', '#e53935', '#b71c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerPanel}
        >
          <Image source={sideLogo} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.heading}>Forgot Password</Text>
          <Text style={styles.subHeading}>Complete each step to reset your account password securely.</Text>
        </LinearGradient>

        <View style={styles.stepperWrap}>
          <View style={styles.stepperRow}>
            <View style={[styles.stepperDot, step >= 1 && styles.stepperDotActive]}>
              <Text style={[styles.stepperDotText, step >= 1 && styles.stepperDotTextActive]}>1</Text>
            </View>
            <View style={styles.stepperLine} />
            <View style={[styles.stepperDot, step >= 2 && styles.stepperDotActive]}>
              <Text style={[styles.stepperDotText, step >= 2 && styles.stepperDotTextActive]}>2</Text>
            </View>
            <View style={styles.stepperLine} />
            <View style={[styles.stepperDot, step >= 3 && styles.stepperDotActive]}>
              <Text style={[styles.stepperDotText, step >= 3 && styles.stepperDotTextActive]}>3</Text>
            </View>
          </View>
          <Text style={styles.stepperCaption}>Email to Verification to New Password</Text>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <View style={[styles.stepCard, step === 1 && styles.stepActive, step > 1 && styles.stepDone]}>
          <Text style={styles.stepTitle}>Step 1: Enter Email and Send Code</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setStep(1);
              setCode('');
              setNewPassword('');
              setConfirmPassword('');
              setDevCode('');
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSendCode} disabled={sendLoading}>
            {sendLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnText}>Send Code</Text>}
          </TouchableOpacity>
          {!!sendStatus && <Text style={styles.okText}>{sendStatus}</Text>}
          {!!devCode && <Text style={styles.devText}>Dev code: {devCode}</Text>}
        </View>

        <View style={[styles.stepCard, step === 2 && styles.stepActive, step > 2 && styles.stepDone, step < 2 && styles.stepLocked]}>
          <Text style={styles.stepTitle}>Step 2: Verify Email Code</Text>
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
            style={[styles.secondaryBtn, step < 2 && styles.disabledButton]}
            onPress={handleVerifyCode}
            disabled={step < 2 || verifyLoading}
          >
            {verifyLoading ? <ActivityIndicator size="small" color="#111827" /> : <Text style={styles.secondaryBtnText}>Verify Code</Text>}
          </TouchableOpacity>
          {!!verifyStatus && <Text style={styles.okText}>{verifyStatus}</Text>}
        </View>

        <View style={[styles.stepCard, step === 3 && styles.stepActive, step < 3 && styles.stepLocked]}>
          <Text style={styles.stepTitle}>Step 3: Set New Password</Text>

          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New password"
            secureTextEntry
            autoCapitalize="none"
            editable={step >= 3}
          />
          <TextInput
            style={[styles.input, styles.mt8]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            secureTextEntry
            autoCapitalize="none"
            editable={step >= 3}
          />

          <View style={styles.rulesWrap}>
            <Text style={[styles.ruleText, rules.length && styles.ruleValid]}>At least 8 characters</Text>
            <Text style={[styles.ruleText, rules.upper && styles.ruleValid]}>At least one uppercase letter</Text>
            <Text style={[styles.ruleText, rules.lower && styles.ruleValid]}>At least one lowercase letter</Text>
            <Text style={[styles.ruleText, rules.number && styles.ruleValid]}>At least one number</Text>
            <Text style={[styles.ruleText, rules.special && styles.ruleValid]}>At least one special character</Text>
            <Text style={[styles.ruleText, passwordsMatch && styles.ruleValid]}>Passwords match</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, step < 3 && styles.disabledButton]}
            onPress={handleResetPassword}
            disabled={step < 3 || resetLoading}
          >
            {resetLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnText}>Reset Password</Text>}
          </TouchableOpacity>

          {!!resetStatus && <Text style={styles.okText}>{resetStatus}</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  pageWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navBtnDark: {
    borderColor: '#111827',
    backgroundColor: '#111827',
  },
  navBtnText: {
    marginLeft: 4,
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  navBtnDarkText: {
    marginLeft: 0,
    color: '#ffffff',
  },
  headerPanel: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 10,
  },
  headerLogo: {
    width: 84,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#ffffff',
  },
  subHeading: {
    marginTop: 4,
    marginBottom: 2,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
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
  stepperLine: {
    width: 28,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  stepperDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  stepperDotActive: {
    borderColor: '#e53935',
    backgroundColor: '#fff1f1',
  },
  stepperDotText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  stepperDotTextActive: {
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
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#ffebee',
    borderRadius: 12,
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
  stepCard: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  stepActive: {
    borderColor: '#f3b3b1',
  },
  stepDone: {
    borderColor: '#86efac',
    backgroundColor: '#f7fff9',
  },
  stepLocked: {
    opacity: 0.58,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e53935',
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
  disabledButton: {
    opacity: 0.5,
  },
  okText: {
    marginTop: 7,
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  devText: {
    marginTop: 4,
    color: '#92400e',
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
  ruleValid: {
    color: '#166534',
    fontWeight: '700',
  },
});
