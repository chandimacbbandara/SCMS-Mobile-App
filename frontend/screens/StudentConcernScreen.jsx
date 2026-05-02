import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { submitConcernWithReport } from '../lib/api';

const StudentConcernScreen = ({ navigation }) => {
  const { user, apiBaseUrl } = useAuth();
  const [concernType, setConcernType] = useState('Normal Concern');
  const [genre, setGenre] = useState('Academic Support and Resources');
  const [description, setDescription] = useState('');
  const [medicalReport, setMedicalReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const genres = [
    'Academic Support and Resources',
    'Medical Concern',
    'Mental Health Support',
    'Financial Aid Issues',
    'Campus Facilities',
    'Extracurricular Activities',
    'Transportation',
    'Accommodation',
    'Food Services',
    'Other'
  ];

  // Request permissions for image picker
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to upload medical reports.');
        return false;
      }
      return true;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: asset.fileName || `medical_report_${Date.now()}.jpg`,
      };
      setMedicalReport(file);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        const file = {
          uri: asset.uri,
          type: asset.mimeType,
          name: asset.name,
        };
        setMedicalReport(file);
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Sorry, we need camera permissions to take photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      const file = {
        uri: asset.uri,
        type: 'image/jpeg',
        name: asset.fileName || `medical_report_${Date.now()}.jpg`,
      };
      setMedicalReport(file);
    }
  };

  const showUploadOptions = () => {
    Alert.alert(
      'Upload Medical Report',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Upload PDF', onPress: pickDocument },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const removeMedicalReport = () => {
    setMedicalReport(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe your concern');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Error', 'Please provide a more detailed description (minimum 10 characters)');
      return;
    }

    setLoading(true);

    try {
      if (!user) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('Login');
        return;
      }

      const concernData = {
        concernType: concernType,
        genre: genre,
        description: description,
        studentId: user.id || user._id,
        age: user.age,
        mobileNumber: user.mobileNumber,
        address: user.address,
        gender: user.gender,
      };

      const response = await submitConcernWithReport(concernData, medicalReport);

      if (response.success) {
        Alert.alert(
          'Submission Successful',
          'Your concern has been submitted and our team will review it shortly.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit concern');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit concern. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Submit Concern</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#e53935', '#b71c1c']}
            style={styles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="megaphone-outline" size={40} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>We're Here to Listen</Text>
            <Text style={styles.bannerSubtitle}>
              Share your concerns or feedback to help us improve your campus experience.
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            {/* Concern Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Concern Type</Text>
              <View style={styles.typeSelector}>
                {['Normal Concern', 'Consulting Support'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      concernType === type && styles.typeOptionActive
                    ]}
                    onPress={() => {
                      setConcernType(type);
                      if (type === 'Consulting Support') {
                        setGenre('Medical Concern');
                        setShowMedicalInfo(true);
                      } else if (genre === 'Medical Concern') {
                        setGenre('Academic Support and Resources');
                        setShowMedicalInfo(false);
                      }
                      setShowCategoryDropdown(false);
                    }}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      concernType === type && styles.typeOptionTextActive
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <TouchableOpacity 
                style={styles.pickerTrigger} 
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                activeOpacity={0.7}
              >
                <View style={styles.pickerMain}>
                  <Ionicons name="grid-outline" size={18} color="#64748b" style={styles.fieldIcon} />
                  <Text style={styles.pickerValue}>{genre}</Text>
                </View>
                <Ionicons name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </TouchableOpacity>

              {showCategoryDropdown && (
                <View style={styles.dropdownMenu}>
                  {(concernType === 'Consulting Support' 
                    ? ['Medical Concern'] 
                    : genres.filter(g => g !== 'Medical Concern')
                  ).map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setGenre(g);
                        setShowMedicalInfo(g === 'Medical Concern');
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, genre === g && styles.dropdownItemTextActive]}>{g}</Text>
                      {genre === g && <Ionicons name="checkmark" size={18} color="#e53935" />}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Medical Info Banner */}
            {showMedicalInfo && (
              <View style={styles.alertBanner}>
                <Ionicons name="medical-outline" size={20} color="#b91c1c" />
                <View style={styles.alertTextWrap}>
                  <Text style={styles.alertTitle}>Medical Assistance</Text>
                  <Text style={styles.alertMessage}>
                    Please provide details and upload any supporting documents. Confidentiality is our priority.
                  </Text>
                </View>
              </View>
            )}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <View style={styles.textAreaContainer}>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={6}
                  placeholder="Tell us what happened..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  textAlignVertical="top"
                />
                <View style={styles.textAreaFooter}>
                  <Text style={[styles.charCount, description.length < 10 && { color: '#ef4444' }]}>
                    {description.length} / 10 min characters
                  </Text>
                </View>
              </View>
            </View>

            {/* File Upload */}
            {showMedicalInfo && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Attachments</Text>
                {!medicalReport ? (
                  <TouchableOpacity style={styles.uploadArea} onPress={showUploadOptions}>
                    <View style={styles.uploadCircle}>
                      <Ionicons name="cloud-upload-outline" size={24} color="#e53935" />
                    </View>
                    <Text style={styles.uploadTitle}>Upload Documents</Text>
                    <Text style={styles.uploadSubtitle}>Tap to select image or PDF</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.fileCard}>
                    <View style={styles.fileIconWrap}>
                      <Ionicons 
                        name={medicalReport.type?.includes('pdf') ? "document-text" : "image"} 
                        size={24} 
                        color="#e53935" 
                      />
                    </View>
                    <View style={styles.fileMeta}>
                      <Text style={styles.fileName} numberOfLines={1}>{medicalReport.name}</Text>
                      <Text style={styles.fileSize}>Ready to upload</Text>
                    </View>
                    <TouchableOpacity onPress={removeMedicalReport} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={24} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#e53935', '#b71c1c']}
                style={styles.submitGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="#ffffff" />
                    <Text style={styles.submitBtnText}>Submit Concern</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#64748b" />
              <Text style={styles.securityText}>
                Your data is encrypted and handled by professional staff.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e53935', // Match red theme
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: '100%',
    marginTop: 10,
  },
  heroBanner: {
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    top: -10,
    transform: [{ rotate: '-15deg' }],
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  formCard: {
    marginTop: -24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
    marginLeft: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  typeOptionTextActive: {
    color: '#e53935',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    height: 52,
  },
  pickerMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    marginRight: 10,
  },
  pickerValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  dropdownMenu: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  dropdownItemTextActive: {
    color: '#e53935',
    fontWeight: '700',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  alertTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#b91c1c',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    color: '#7f1d1d',
    lineHeight: 18,
  },
  textAreaContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  textArea: {
    minHeight: 120,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  textAreaFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'right',
  },
  uploadArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#e53935',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileMeta: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },
  fileSize: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    marginTop: 2,
  },
  removeBtn: {
    padding: 4,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 3,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

export default StudentConcernScreen;