// screens/StudentConcernScreen.jsx
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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitConcernWithReport } from '../lib/api';

const StudentConcernScreen = ({ navigation, route }) => {
  const [genre, setGenre] = useState('Academic Support and Resources');
  const [description, setDescription] = useState('');
  const [medicalReport, setMedicalReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showMedicalInfo, setShowMedicalInfo] = useState(false);

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

  // Debug auth on component mount
  useEffect(() => {
    const debugAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('scms_auth_token');
        const userData = await AsyncStorage.getItem('scms_auth_user');
        
        console.log('========== DEBUG AUTH ==========');
        console.log('Token exists:', !!token);
        if (token) {
          console.log('Token preview:', token.substring(0, 50) + '...');
        }
        console.log('User data exists:', !!userData);
        
        if (userData) {
          const user = JSON.parse(userData);
          console.log('User ID:', user.id || user._id);
          console.log('User role:', user.role);
          console.log('User email:', user.email);
          console.log('User age:', user.age);
          console.log('User GPA:', user.gpa);
          console.log('User year:', user.year);
          console.log('User gender:', user.gender);
        }
        console.log('================================');
      } catch (error) {
        console.error('Debug error:', error);
      }
    };
    
    debugAuth();
  }, []);

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

  // Pick image from gallery - FIXED deprecated MediaTypeOptions
  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // ✅ FIXED: Changed from MediaTypeOptions.Images
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const file = {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: `medical_report_${Date.now()}.jpg`,
      };
      setMedicalReport(file);
    }
  };

  // Pick document (PDF)
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const file = {
          uri: result.uri,
          type: result.mimeType,
          name: result.name,
        };
        setMedicalReport(file);
      }
    } catch (error) {
      console.log('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  // Take photo with camera
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
      const file = {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: `medical_report_${Date.now()}.jpg`,
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
      // Get user data from storage
      const userData = await AsyncStorage.getItem('scms_auth_user');
      const token = await AsyncStorage.getItem('scms_auth_token');
      
      console.log('=== SUBMIT DEBUG ===');
      console.log('Token exists:', !!token);
      console.log('User data exists:', !!userData);
      
      const user = userData ? JSON.parse(userData) : null;

      if (!user || !token) {
        console.log('Missing user or token');
        Alert.alert('Error', 'Please login again');
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
        return;
      }

      console.log('Student ID being sent:', user.id || user._id);

      // Prepare concern data
      const concernData = {
        genre: genre,
        description: description,
        studentId: user.id || user._id,
        age: user.age,
        gpa: user.gpa,
        year: user.year,
        gender: user.gender,
      };

      console.log('Concern data:', concernData);

      // Submit the concern
      const response = await submitConcernWithReport(concernData, medicalReport);

      console.log('Response:', response);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your concern has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setDescription('');
                setMedicalReport(null);
                setGenre('Academic Support and Resources');
                setShowMedicalInfo(false);
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit concern');
      }
    } catch (error) {
      console.error('Submission error details:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit concern. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Submit a Concern</Text>
          <Text style={styles.subtitle}>
            Your voice matters. Share your concerns with us.
          </Text>
        </View>

        {/* Genre Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={genre}
              onValueChange={(itemValue) => {
                setGenre(itemValue);
                setShowMedicalInfo(itemValue === 'Medical Concern');
              }}
              style={styles.picker}
            >
              {genres.map((g) => (
                <Picker.Item key={g} label={g} value={g} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Medical Information (conditional) */}
        {showMedicalInfo && (
          <View style={styles.medicalInfoContainer}>
            <Text style={styles.medicalInfoTitle}>Medical Concern Details</Text>
            <Text style={styles.medicalInfoText}>
              Please upload any relevant medical reports or documents to help us better
              understand and address your concern. All information will be kept confidential.
            </Text>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={6}
            placeholder="Please describe your concern in detail..."
            placeholderTextColor="#999"
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {description.length} characters (minimum 10)
          </Text>
        </View>

        {/* Medical Report Upload (only for medical concerns) */}
        {showMedicalInfo && (
          <View style={styles.section}>
            <Text style={styles.label}>Medical Report (Optional but recommended)</Text>
            {!medicalReport ? (
              <TouchableOpacity style={styles.uploadButton} onPress={showUploadOptions}>
                <Text style={styles.uploadButtonText}>📎 Upload Medical Report</Text>
                <Text style={styles.uploadSubtext}>
                  Support: JPG, PNG, PDF (Max 10MB)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.filePreview}>
                <View style={styles.fileInfo}>
                  <Text style={styles.fileIcon}>
                    {medicalReport.type && medicalReport.type.includes('pdf') ? '📄' : '🖼️'}
                  </Text>
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {medicalReport.name}
                    </Text>
                    <Text style={styles.fileType}>
                      {medicalReport.type && medicalReport.type.includes('pdf') ? 'PDF Document' : 'Image File'}
                    </Text>
                  </View>
                </View>
                {medicalReport.uri && !medicalReport.uri.includes('file://') && (
                  <Image source={{ uri: medicalReport.uri }} style={styles.thumbnail} />
                )}
                <TouchableOpacity
                  style={styles.removeFileButton}
                  onPress={removeMedicalReport}
                >
                  <Text style={styles.removeFileText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Additional Info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Your concern will be reviewed by our team. We typically respond within 2-3
            business days. All information is kept confidential.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Concern</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  textArea: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  medicalInfoContainer: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196f3',
  },
  medicalInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  medicalInfoText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  uploadButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  uploadButtonText: {
    fontSize: 16,
    color: '#2196f3',
    fontWeight: '600',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#999',
  },
  filePreview: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  fileType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeFileButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 6,
  },
  removeFileText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#90caf9',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default StudentConcernScreen;