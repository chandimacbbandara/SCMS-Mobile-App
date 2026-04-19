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
import * as ImagePicker from 'expo-image-picker';
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

export default function RegisterScreen({ navigation }) {
  const { sendRegisterCode, verifyRegisterCode, register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [photoFile, setPhotoFile] = useState(null);

  const [emailVerified, setEmailVerified] = useState(false);
  const [sendCodeMessage, setSendCodeMessage] = useState('');
  const [confirmCodeMessage, setConfirmCodeMessage] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [confirmCodeLoading, setConfirmCodeLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const rules = useMemo(() => passwordRules(password), [password]);
  const passwordMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  async function pickStudentPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setGeneralError('Please allow gallery permission to select student ID photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [4, 3],
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setPhotoFile({
      uri: asset.uri,
      fileName: asset.fileName || `student-photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType || 'image/jpeg',
    });
  }

  async function handleSendCode() {
    if (!email.trim()) {
      setSendCodeMessage('Enter your email first');
      return;
    }

    setSendCodeLoading(true);
    setSendCodeMessage('');
    setConfirmCodeMessage('');
    setGeneralError('');
    setEmailVerified(false);

    try {
      const response = await sendRegisterCode(email.trim(), firstName.trim());
      setSendCodeMessage(response.message || 'Verification code sent');
    } catch (error) {
      setSendCodeMessage(error.message || 'Could not send verification code');
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function handleVerifyCode() {
    if (!email.trim() || !code.trim()) {
      setConfirmCodeMessage('Enter email and verification code');
      return;
    }

    setConfirmCodeLoading(true);
    setConfirmCodeMessage('');
    setGeneralError('');

    try {
      const response = await verifyRegisterCode(email.trim(), code.trim());
      setEmailVerified(true);
      setConfirmCodeMessage(response.message || 'Email verified');
    } catch (error) {
      setEmailVerified(false);
      setConfirmCodeMessage(error.message || 'Code verification failed');
    } finally {
      setConfirmCodeLoading(false);
    }
  }

  async function handleRegister() {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !studentId.trim()) {
      setGeneralError('Please fill all required fields');
      return;
    }

    if (!emailVerified) {
      setGeneralError('Please verify your email code before creating account');
      return;
    }

    if (!allRulesValid(rules)) {
      setGeneralError('Password does not meet required format');
      return;
    }

    if (!passwordMatch) {
      setGeneralError('Passwords do not match');
      return;
    }

    setRegisterLoading(true);
    setGeneralError('');

    try {
      await register(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          studentId: studentId.trim(),
          password,
          confirmPassword,
        },
        photoFile
      );
    } catch (error) {
      setGeneralError(error.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
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
            <Text style={styles.headerTitle}>Create Student Account</Text>
            <Text style={styles.headerSub}>Verify your email and register with your student details.</Text>
          </LinearGradient>

          {!!generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Personal Details</Text>

            <View style={styles.rowTwo}>
              <View style={[styles.inputGroup, styles.flexOne]}>
                <Text style={styles.label}>First name</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
              </View>
              <View style={[styles.inputGroup, styles.flexOne]}>
                <Text style={styles.label}>Last name</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, styles.flexOne]}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setEmailVerified(false);
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.inlineBtnPrimary} onPress={handleSendCode} disabled={sendCodeLoading}>
                  {sendCodeLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.inlineBtnPrimaryText}>Send</Text>}
                </TouchableOpacity>
              </View>
              {!!sendCodeMessage && <Text style={styles.inlineStatus}>{sendCodeMessage}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Verification code</Text>
              <View style={styles.inlineRow}>
                <TextInput
                  style={[styles.input, styles.flexOne]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity style={styles.inlineBtnGhost} onPress={handleVerifyCode} disabled={confirmCodeLoading}>
                  {confirmCodeLoading ? <ActivityIndicator size="small" color="#e53935" /> : <Text style={styles.inlineBtnGhostText}>Verify</Text>}
                </TouchableOpacity>
              </View>
              {!!confirmCodeMessage && (
                <Text style={[styles.inlineStatus, emailVerified ? styles.okStatus : styles.errorStatus]}>
                  {confirmCodeMessage}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Student ID</Text>
              <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="e.g. STU2024001" />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword((value) => !value)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword((value) => !value)}>
                  <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.ruleWrap}>
              <Text style={[styles.ruleText, rules.length && styles.ruleOk]}>At least 8 characters</Text>
              <Text style={[styles.ruleText, rules.upper && styles.ruleOk]}>At least one uppercase letter</Text>
              <Text style={[styles.ruleText, rules.lower && styles.ruleOk]}>At least one lowercase letter</Text>
              <Text style={[styles.ruleText, rules.number && styles.ruleOk]}>At least one number</Text>
              <Text style={[styles.ruleText, rules.special && styles.ruleOk]}>At least one special character</Text>
              <Text style={[styles.ruleText, passwordMatch && styles.ruleOk]}>Passwords match</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Student ID Photo</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickStudentPhoto} activeOpacity={0.9}>
              <Ionicons name="cloud-upload-outline" size={18} color="#e53935" />
              <Text style={styles.uploadBtnText}>{photoFile ? 'Replace ID photo' : 'Upload ID photo'}</Text>
            </TouchableOpacity>

            {photoFile?.uri && (
              <View style={styles.previewBox}>
                <Image source={{ uri: photoFile.uri }} style={styles.previewImage} />
                <Text style={styles.previewName}>{photoFile.fileName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={registerLoading} activeOpacity={0.9}>
            {registerLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={17} color="#ffffff" />
                <Text style={styles.submitBtnText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomHint}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.bottomLink}>Sign in</Text>
            </TouchableOpacity>
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
    fontSize: 27,
    fontWeight: '900',
    marginBottom: 3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 20,
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    backgroundColor: '#ffffff',
    padding: 13,
    marginBottom: 10,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 8,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineBtnPrimary: {
    minWidth: 80,
    borderRadius: 11,
    backgroundColor: '#e53935',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineBtnGhost: {
    minWidth: 80,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    backgroundColor: '#ffffff',
    paddingVertical: 11,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineBtnGhostText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineStatus: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  okStatus: {
    color: '#166534',
  },
  errorStatus: {
    color: '#b91c1c',
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
  ruleWrap: {
    marginTop: 2,
  },
  ruleText: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  ruleOk: {
    color: '#166534',
    fontWeight: '700',
  },
  uploadBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderStyle: 'dashed',
    backgroundColor: '#fffafb',
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  uploadBtnText: {
    marginLeft: 7,
    color: '#e53935',
    fontSize: 13,
    fontWeight: '800',
  },
  previewBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: 160,
    height: 120,
    borderRadius: 11,
  },
  previewName: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  submitBtn: {
    marginTop: 4,
    borderRadius: 12,
    backgroundColor: '#e53935',
    minHeight: 51,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitBtnText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  bottomRow: {
    marginTop: 13,
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
});
