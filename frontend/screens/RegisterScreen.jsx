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
  const {
    sendRegisterCode,
    verifyRegisterCode,
    register,
  } = useAuth();

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
  const [devCode, setDevCode] = useState('');

  const [sendCodeLoading, setSendCodeLoading] = useState(false);
  const [confirmCodeLoading, setConfirmCodeLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

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
      setDevCode(response.devCode || '');
    } catch (error) {
      setSendCodeMessage(error.message || 'Could not send verification code');
      setDevCode('');
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
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity
            style={styles.topNavBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.9}
          >
            <Ionicons name="chevron-back" size={16} color="#111827" />
            <Text style={styles.topNavBtnText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topNavBtn, styles.topNavBtnDark]}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
          >
            <Text style={[styles.topNavBtnText, styles.topNavBtnDarkText]}>Login</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#ef5350', '#e53935', '#b71c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.leftPanel}
        >
          <Image source={sideLogo} style={styles.leftLogo} resizeMode="contain" />
          <Text style={styles.leftTitle}>Join Us Today</Text>
          <Text style={styles.leftSubtitle}>
            Create your student account and start managing academic concerns.
          </Text>

          <View style={styles.stepRow}><Text style={styles.stepNumber}>1</Text><Text style={styles.stepText}>Fill personal details</Text></View>
          <View style={styles.stepRow}><Text style={styles.stepNumber}>2</Text><Text style={styles.stepText}>Verify email code</Text></View>
          <View style={styles.stepRow}><Text style={styles.stepNumber}>3</Text><Text style={styles.stepText}>Set secure password</Text></View>
          <View style={styles.stepRow}><Text style={styles.stepNumber}>4</Text><Text style={styles.stepText}>Upload ID photo</Text></View>
        </LinearGradient>

        <View style={styles.formPanel}>
          <Text style={styles.heading}>Create Account</Text>
          <Text style={styles.subHeading}>Complete the form below to register as a student.</Text>

          {!!generalError && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          )}

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, styles.flexOne]}>
                <Text style={styles.label}>First Name</Text>
                <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} placeholder="First name" />
              </View>
              <View style={[styles.formGroup, styles.flexOne]}>
                <Text style={styles.label}>Last Name</Text>
                <TextInput style={styles.input} value={lastName} onChangeText={setLastName} placeholder="Last name" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.actionInputRow}>
                <TextInput
                  style={[styles.input, styles.flexOne]}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    setEmailVerified(false);
                    setDevCode('');
                  }}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={handleSendCode} style={styles.inlineButton} disabled={sendCodeLoading}>
                  {sendCodeLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.inlineButtonText}>Send</Text>
                  )}
                </TouchableOpacity>
              </View>
              {!!sendCodeMessage && <Text style={styles.statusText}>{sendCodeMessage}</Text>}
              {!!devCode && <Text style={styles.devText}>Dev code: {devCode}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email Verification Code</Text>
              <View style={styles.actionInputRow}>
                <TextInput
                  style={[styles.input, styles.flexOne]}
                  value={code}
                  onChangeText={setCode}
                  placeholder="6-digit code"
                  keyboardType="numeric"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={handleVerifyCode}
                  style={[styles.inlineButton, styles.inlineButtonSecondary]}
                  disabled={confirmCodeLoading}
                >
                  {confirmCodeLoading ? (
                    <ActivityIndicator size="small" color="#e53935" />
                  ) : (
                    <Text style={styles.inlineSecondaryText}>Confirm</Text>
                  )}
                </TouchableOpacity>
              </View>
              {!!confirmCodeMessage && (
                <Text style={[styles.statusText, emailVerified ? styles.statusOk : styles.statusError]}>
                  {confirmCodeMessage}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Student ID</Text>
              <TextInput style={styles.input} value={studentId} onChangeText={setStudentId} placeholder="e.g. STU2024001" />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Security</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Re-enter password"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.rulesWrap}>
              <Text style={[styles.ruleText, rules.length && styles.ruleValid]}>At least 8 characters</Text>
              <Text style={[styles.ruleText, rules.upper && styles.ruleValid]}>At least one uppercase letter</Text>
              <Text style={[styles.ruleText, rules.lower && styles.ruleValid]}>At least one lowercase letter</Text>
              <Text style={[styles.ruleText, rules.number && styles.ruleValid]}>At least one number</Text>
              <Text style={[styles.ruleText, rules.special && styles.ruleValid]}>At least one special character</Text>
              <Text style={[styles.ruleText, passwordMatch && styles.ruleValid]}>Passwords match</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Student ID Verification</Text>

            <TouchableOpacity style={styles.photoPicker} onPress={pickStudentPhoto}>
              <Ionicons name="cloud-upload-outline" size={19} color="#e53935" />
              <Text style={styles.photoPickerText}>Upload Student ID Card Photo</Text>
            </TouchableOpacity>

            {photoFile?.uri && (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photoFile.uri }} style={styles.previewImage} />
                <Text style={styles.previewText}>{photoFile.fileName}</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleRegister} disabled={registerLoading}>
            {registerLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={17} color="#ffffff" />
                <Text style={styles.submitBtnText}>Create Account</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerHint}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  contentContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  topNavBtn: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 7,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topNavBtnDark: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  topNavBtnText: {
    marginLeft: 4,
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  topNavBtnDarkText: {
    color: '#ffffff',
    marginLeft: 0,
  },
  leftPanel: {
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 12,
  },
  leftLogo: {
    width: 110,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    marginBottom: 14,
  },
  leftTitle: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: '800',
  },
  leftSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '800',
    color: '#ffffff',
    marginRight: 9,
    fontSize: 12,
  },
  stepText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  formPanel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 2,
  },
  heading: {
    fontSize: 27,
    fontWeight: '800',
    color: '#111827',
  },
  subHeading: {
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 12,
    fontSize: 13,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#ffebee',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  errorText: {
    marginLeft: 6,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '800',
    color: '#e53935',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: '#e4eaf2',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fbfdff',
  },
  flexOne: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 11,
  },
  label: {
    marginBottom: 6,
    fontSize: 12,
    color: '#374151',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 13,
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  actionInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inlineButton: {
    minWidth: 84,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineButtonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8e1ec',
  },
  inlineButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineSecondaryText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },
  statusText: {
    marginTop: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },
  statusOk: {
    color: '#166534',
  },
  statusError: {
    color: '#b91c1c',
  },
  devText: {
    marginTop: 4,
    color: '#92400e',
    fontSize: 12,
    fontWeight: '700',
  },
  rulesWrap: {
    marginTop: 3,
    marginBottom: 12,
  },
  ruleText: {
    color: '#6b7280',
    fontSize: 12,
    marginBottom: 4,
  },
  ruleValid: {
    color: '#166534',
    fontWeight: '700',
  },
  photoPicker: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#fffafb',
  },
  photoPickerText: {
    color: '#e53935',
    fontWeight: '700',
    fontSize: 13,
  },
  previewWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  previewImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
  },
  previewText: {
    marginTop: 6,
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 13,
    backgroundColor: '#e53935',
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
  footerRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerHint: {
    color: '#6b7280',
    fontSize: 13,
    marginRight: 6,
  },
  footerLink: {
    color: '#e53935',
    fontSize: 13,
    fontWeight: '800',
  },
});
