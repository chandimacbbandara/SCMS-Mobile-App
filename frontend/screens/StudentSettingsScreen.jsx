import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';

export default function StudentSettingsScreen({ navigation }) {
  const { user, apiBaseUrl, updateStudentProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [address, setAddress] = useState(user?.address || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [profilePhoto, setProfilePhoto] = useState(null);

  const studentPhotoUri = user?.studentIdPhoto
    ? (user.studentIdPhoto.startsWith('http') ? user.studentIdPhoto : `${apiBaseUrl.replace('/api', '')}${user.studentIdPhoto}`)
    : null;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePhoto(result.assets[0]);
    }
  };

  const handleSave = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'First Name and Last Name are required.');
      return;
    }

    setSaving(true);
    try {
      const profileData = {
        firstName,
        lastName,
        age: age ? Number(age) : undefined,
        mobileNumber,
        address,
        gender,
      };

      const response = await updateStudentProfile(profileData, profilePhoto);

      if (response.status === 'ok') {
        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      } else {
        Alert.alert('Error', response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (label, value, setter, placeholder, icon, keyboardType = 'default', multiline = false, editable = true) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, !editable && styles.inputDisabled]}>
        <Ionicons name={icon} size={18} color={editable ? "#64748b" : "#94a3b8"} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, multiline && styles.textArea]}
          value={value}
          onChangeText={setter}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          editable={editable}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.9} style={styles.photoContainer}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto.uri }} style={styles.avatarImage} />
              ) : studentPhotoUri ? (
                <Image source={{ uri: studentPhotoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarFallbackText}>
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.editIconBadge}>
                <Ionicons name="camera" size={16} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change profile picture</Text>
          </View>

          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#1e40af" />
            <Text style={styles.infoText}>
              Email and Student ID are verified and cannot be changed.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            {renderInput('Student ID', user?.studentId, () => {}, '', 'id-card-outline', 'default', false, false)}
            {renderInput('Email Address', user?.email, () => {}, '', 'mail-outline', 'default', false, false)}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderInput('First Name', firstName, setFirstName, 'First Name', 'person-outline')}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                {renderInput('Last Name', lastName, setLastName, 'Last Name', 'person-outline')}
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                {renderInput('Age', age, setAge, 'Age', 'calendar-outline', 'numeric')}
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.pickerContainer}>
                  <Ionicons name="transgender-outline" size={18} color="#64748b" style={styles.inputIcon} />
                  <TouchableOpacity 
                    style={styles.genderPicker}
                    onPress={() => {
                      Alert.alert(
                        'Select Gender',
                        '',
                        [
                          { text: 'Male', onPress: () => setGender('M') },
                          { text: 'Female', onPress: () => setGender('F') },
                          { text: 'Cancel', style: 'cancel' },
                        ]
                      );
                    }}
                  >
                    <Text style={[styles.genderText, !gender && { color: '#94a3b8' }]}>
                      {gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : 'Select'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {renderInput('Mobile Number', mobileNumber, setMobileNumber, 'e.g. 0712345678', 'call-outline', 'phone-pad')}
            {renderInput('Address', address, setAddress, 'Enter your full address', 'location-outline', 'default', true)}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#e53935', '#b71c1c']}
                style={styles.saveGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  scrollContent: {
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#b71c1c',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  photoHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 52,
  },
  genderPicker: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  genderText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 40,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
