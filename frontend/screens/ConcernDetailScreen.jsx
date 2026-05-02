import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest, getApiBaseUrl } from '../lib/api';

const ConcernDetailScreen = ({ route, navigation }) => {
  const { concern: initialConcern } = route.params;
  const { user, token } = useAuth();
  
  const [concern, setConcern] = useState(initialConcern);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editReplyText, setEditReplyText] = useState('');

  const isStaff = user?.role === 'consulter' || user?.role === 'admin';

  const getStatusConfig = (status) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'pending':
        return { color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline', label: 'Pending' };
      case 'reviewing':
        return { color: '#3b82f6', bg: '#dbeafe', icon: 'eye-outline', label: 'Reviewing' };
      case 'resolved':
        return { color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-circle-outline', label: 'Completed' };
      case 'rejected':
        return { color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline', label: 'Rejected' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', icon: 'help-circle-outline', label: 'Unknown' };
    }
  };

  const config = getStatusConfig(concern.status);

  const getReportUrl = () => {
    if (!concern.medicalReport || !concern.medicalReport.path) return null;
    const rawPath = concern.medicalReport.path.startsWith('/') 
      ? concern.medicalReport.path 
      : `/${concern.medicalReport.path}`;
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    return `${baseUrl}${rawPath}`;
  };

  const downloadMedicalReport = async () => {
    const fileUrl = getReportUrl();
    if (!fileUrl) {
      Alert.alert('Error', 'Medical report file not found.');
      return;
    }
    
    try {
      await Linking.openURL(fileUrl);
    } catch (error) {
      Alert.alert('Error', 'Failed to open the medical report.');
    }
  };

  const markAsReviewing = async () => {
    setSubmitting(true);
    try {
      const concernId = concern.id || concern._id;
      const result = await apiRequest(`/concerns/status/${concernId}`, {
        method: 'PUT',
        token,
        body: { status: 'reviewing' },
      });
      setConcern(result.data || concern);
      Alert.alert('Success', 'Concern marked as Reviewing.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async () => {
    if (!replyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message.');
      return;
    }

    setSubmitting(true);
    try {
      const concernId = concern.id || concern._id;
      const result = await apiRequest(`/concerns/reply/${concernId}`, {
        method: 'POST',
        token,
        body: { reply: replyText },
      });
      
      setConcern(result.data || concern);
      Alert.alert('Success', 'Reply submitted successfully.');
      setReplyText('');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to submit reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateReply = async () => {
    if (!editReplyText.trim()) {
      Alert.alert('Error', 'Please enter a reply message.');
      return;
    }

    setSubmitting(true);
    try {
      const concernId = concern.id || concern._id;
      const result = await apiRequest(`/concerns/reply/${concernId}`, {
        method: 'PUT',
        token,
        body: { reply: editReplyText },
      });
      
      setConcern(result.data || concern);
      Alert.alert('Success', 'Reply updated successfully.');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update reply.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: deleteReply }
      ]
    );
  };

  const deleteReply = async () => {
    setSubmitting(true);
    try {
      const concernId = concern.id || concern._id;
      const result = await apiRequest(`/concerns/reply/${concernId}`, {
        method: 'DELETE',
        token,
      });
      
      setConcern(result.data || concern);
      Alert.alert('Success', 'Reply deleted successfully.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete reply.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Concern Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.typeText}>{concern.concernType || 'Normal Concern'}</Text>
              <Text style={styles.genreText}>{concern.genre}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={14} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Description</Text>
              {isStaff && concern.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.actionPill} 
                  onPress={markAsReviewing}
                  disabled={submitting}
                >
                  <Ionicons name="play-outline" size={14} color="#3b82f6" />
                  <Text style={styles.actionPillText}>Review</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.descriptionText}>{concern.description}</Text>
          </View>

          {concern.medicalReport && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical Report</Text>
              
              {concern.medicalReport.mimetype && concern.medicalReport.mimetype.startsWith('image/') && (
                <View style={styles.imageContainer}>
                  <Image 
                    source={{ uri: getReportUrl() }} 
                    style={styles.reportImage} 
                    resizeMode="cover"
                  />
                </View>
              )}

              <TouchableOpacity style={styles.downloadArea} onPress={downloadMedicalReport}>
                <View style={styles.fileIconWrap}>
                  <Ionicons 
                    name={concern.medicalReport.mimetype?.includes('pdf') ? "document-text" : "image"} 
                    size={20} 
                    color="#e53935" 
                  />
                </View>
                <View style={styles.fileMeta}>
                  <Text style={styles.fileName}>
                    {concern.medicalReport.mimetype?.includes('pdf') ? 'Open PDF Document' : 'View High-Res Image'}
                  </Text>
                  <Text style={styles.fileSub}>Tap to open attachment</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.metaBox}>
            <Ionicons name="time-outline" size={14} color="#94a3b8" />
            <Text style={styles.metaDate}>
              Submitted on {new Date(concern.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short'
              })}
            </Text>
          </View>
        </View>

        {concern.adminReply && !isEditing && (
          <View style={styles.replyCard}>
            <View style={styles.replyHeader}>
              <View style={styles.replyTitleWrap}>
                <View style={styles.replyDot} />
                <Text style={styles.replyTitle}>Official Response</Text>
              </View>
              {isStaff && (
                <View style={styles.adminActions}>
                  <TouchableOpacity onPress={() => { setIsEditing(true); setEditReplyText(concern.adminReply); }} style={styles.adminActionBtn}>
                    <Ionicons name="pencil" size={16} color="#0f766e" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmDelete} style={styles.adminActionBtn}>
                    <Ionicons name="trash" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            <View style={styles.replyBubble}>
              <Text style={styles.replyContent}>{concern.adminReply}</Text>
              {concern.repliedAt && (
                <Text style={styles.replyTimestamp}>
                  Replied at {new Date(concern.repliedAt).toLocaleString(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </Text>
              )}
            </View>
          </View>
        )}

        {isEditing && (
          <View style={styles.staffActionCard}>
            <View style={styles.staffHeader}>
              <Text style={styles.staffTitle}>Edit Response</Text>
              <TouchableOpacity onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.replyInput}
              placeholder="Update your response..."
              multiline
              value={editReplyText}
              onChangeText={setEditReplyText}
              editable={!submitting}
            />
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={updateReply}
              disabled={submitting || !editReplyText.trim()}
            >
              <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.btnGradient}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Update Response</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {isStaff && concern.status !== 'resolved' && !concern.adminReply && (
          <View style={styles.staffActionCard}>
            <Text style={styles.staffTitle}>Submit a Response</Text>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply to the student..."
              multiline
              value={replyText}
              onChangeText={setReplyText}
              editable={!submitting}
            />
            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={submitReply}
              disabled={submitting || !replyText.trim()}
            >
              <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.btnGradient}>
                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.btnText}>Send Response</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e53935',
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
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  typeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e53935',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  genreText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#3b82f6',
  },
  descriptionText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  reportImage: {
    width: '100%',
    height: '100%',
  },
  downloadArea: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fileIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
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
  fileSub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  metaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  replyCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 20,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  replyTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  replyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#166534',
  },
  adminActions: {
    flexDirection: 'row',
    gap: 12,
  },
  adminActionBtn: {
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  replyBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#16a34a',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  replyContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  replyTimestamp: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  staffActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  staffHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  staffTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 16,
  },
  cancelText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  replyInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  btnGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ConcernDetailScreen;