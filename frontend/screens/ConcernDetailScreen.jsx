// screens/ConcernDetailScreen.jsx
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
} from 'react-native';
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'reviewing':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const getStatusText = (status) => {
    if (status === 'reviewing') return 'In Progress';
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const downloadMedicalReport = async () => {
    if (!concern.medicalReport || !concern.medicalReport.path) {
      Alert.alert('Error', 'Medical report file not found.');
      return;
    }
    
    // Normalize path to prevent double slashes
    const rawPath = concern.medicalReport.path.startsWith('/') 
      ? concern.medicalReport.path 
      : `/${concern.medicalReport.path}`;
      
    const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
    const fileUrl = `${baseUrl}${rawPath}`;
    
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Error', 'Cannot open the medical report link. Device may not support this file type.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open the medical report. ' + error.message);
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
      Alert.alert('Success', 'Concern marked as In Progress.');
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.genre}>{concern.genre}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
          <Text style={styles.statusText}>
            {getStatusText(concern.status)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.descriptionHeaderRow}>
          <Text style={styles.sectionTitleNoMargin}>Description</Text>
          {isStaff && concern.status === 'pending' && (
            <TouchableOpacity 
              style={styles.markProgressBtn} 
              onPress={markAsReviewing}
              disabled={submitting}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#2196f3" />
              <Text style={styles.markProgressText}>Mark as In Progress</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.description}>{concern.description}</Text>
      </View>

      {concern.medicalReport && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Report</Text>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadMedicalReport}>
            <Ionicons name="document-attach" size={20} color="#fff" />
            <Text style={styles.downloadButtonText}>View Medical Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {concern.adminReply && !isEditing && (
        <View style={[styles.section, styles.replySection]}>
          <View style={styles.replyHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>Admin Response</Text>
            {isStaff && (
              <View style={styles.replyActions}>
                <TouchableOpacity onPress={() => { setIsEditing(true); setEditReplyText(concern.adminReply); }} style={styles.iconBtn}>
                  <Ionicons name="pencil" size={18} color="#0f766e" />
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmDelete} style={styles.iconBtn}>
                  <Ionicons name="trash" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.replyContainer}>
            <Ionicons name="chatbubble" size={20} color="#4caf50" />
            <Text style={styles.replyText}>{concern.adminReply}</Text>
            {concern.repliedAt && (
              <Text style={styles.replyDate}>
                {new Date(concern.repliedAt).toLocaleString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {concern.adminReply && isEditing && (
        <View style={[styles.section, styles.staffReplySection]}>
          <View style={styles.replyHeaderRow}>
            <Text style={styles.sectionTitleNoMargin}>Edit Reply</Text>
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={{color: '#64748b'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your response..."
            multiline
            numberOfLines={4}
            value={editReplyText}
            onChangeText={setEditReplyText}
            editable={!submitting}
          />
          <TouchableOpacity 
            style={styles.submitReplyBtn} 
            onPress={updateReply}
            disabled={submitting || !editReplyText.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="save" size={16} color="#fff" />
                <Text style={styles.submitReplyBtnText}>Update Reply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {isStaff && concern.status !== 'resolved' && !concern.adminReply && (
        <View style={[styles.section, styles.staffReplySection]}>
          <Text style={styles.sectionTitle}>Write a Reply</Text>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your response to the student..."
            multiline
            numberOfLines={4}
            value={replyText}
            onChangeText={setReplyText}
            editable={!submitting}
          />
          <TouchableOpacity 
            style={styles.submitReplyBtn} 
            onPress={submitReply}
            disabled={submitting || !replyText.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={16} color="#fff" />
                <Text style={styles.submitReplyBtnText}>Submit Reply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.metaInfo}>
        <Text style={styles.metaText}>
          Submitted: {new Date(concern.createdAt).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  descriptionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  markProgressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  markProgressText: {
    color: '#2196f3',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  replySection: {
    backgroundColor: '#e8f5e9',
  },
  replyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  replyActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  replyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  replyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  metaInfo: {
    padding: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  staffReplySection: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  replyInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#334155',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitReplyBtn: {
    backgroundColor: '#0f766e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  submitReplyBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default ConcernDetailScreen;