import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Image,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'Pending', color: '#f59e0b' },
  { id: 'reviewing', label: 'Reviewing', color: '#3b82f6' },
  { id: 'resolved', label: 'Completed', color: '#10b981' },
  { id: 'rejected', label: 'Rejected', color: '#ef4444' },
];

function formatDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusColor(status) {
  const statusObj = STATUS_OPTIONS.find(s => s.id === status);
  return statusObj?.color || '#64748b';
}

function getStatusLabel(status) {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'reviewing':
      return 'Reviewing';
    case 'resolved':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
    default:
      return 'Unknown';
  }
}

export default function AdminConcernDetailScreen({ navigation, route }) {
  const { concern } = route?.params || {};
  const { token, apiBaseUrl } = useAuth();

  const [currentConcern, setCurrentConcern] = useState(concern);
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState(currentConcern?.adminReply || '');
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const student = currentConcern?.studentId || {};

  const handleReply = async () => {
    if (!reply.trim()) {
      Alert.alert('Validation', 'Please enter a reply message');
      return;
    }

    if (reply.length < 10) {
      Alert.alert('Validation', 'Reply must be at least 10 characters');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const endpoint = currentConcern?.adminReply
        ? `/concerns/reply/${currentConcern._id}`
        : `/concerns/reply/${currentConcern._id}`;

      const method = currentConcern?.adminReply ? 'PUT' : 'POST';

      const response = await apiRequest(endpoint, {
        method,
        token,
        body: {
          reply: reply,
        },
      });

      setCurrentConcern(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Reply saved successfully!');
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save reply');
      Alert.alert('Error', error.message || 'Failed to save reply');
      console.error('Reply error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReply = async () => {
    Alert.alert(
      'Delete Reply',
      'Are you sure you want to delete this reply?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            setErrorMessage('');

            try {
              const response = await apiRequest(`/concerns/reply/${currentConcern._id}`, {
                method: 'DELETE',
                token,
              });

              setCurrentConcern(response.data);
              setReply('');
              setIsEditing(false);
              Alert.alert('Success', 'Reply deleted successfully!');
            } catch (error) {
              setErrorMessage(error.message || 'Failed to delete reply');
              Alert.alert('Error', error.message || 'Failed to delete reply');
              console.error('Delete reply error:', error);
            } finally {
              setLoading(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteConcern = async () => {
    Alert.alert(
      'Delete Concern',
      'This will permanently remove the concern and its medical report if one exists. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setErrorMessage('');

            try {
              await apiRequest(`/concerns/${currentConcern._id}`, {
                method: 'DELETE',
                token,
              });

              Alert.alert('Success', 'Concern deleted successfully', [
                {
                  text: 'OK',
                  onPress: () => navigation.goBack(),
                },
              ]);
            } catch (error) {
              setErrorMessage(error.message || 'Failed to delete concern');
              Alert.alert('Error', error.message || 'Failed to delete concern');
              console.error('Delete concern error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (!currentConcern) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyStateWrap}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.emptyStateTitle}>Loading concern details...</Text>
          <Text style={styles.emptyStateText}>If this stays here, reopen the concern from the list.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(currentConcern?.status) }]} />
          <Text style={styles.statusBarText}>{getStatusLabel(currentConcern?.status).toUpperCase()}</Text>
          <TouchableOpacity
            style={styles.deleteConcernBtn}
            onPress={handleDeleteConcern}
          >
            <Ionicons name="trash-outline" size={16} color="#ef4444" />
            <Text style={styles.deleteConcernText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Student Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          <View style={styles.studentCard}>
            <View style={styles.largeAvatar}>
              {student?.studentIdPhoto ? (
                  <Image
                      source={{ uri: `${apiBaseUrl}${student.studentIdPhoto}` }}
                      style={styles.avatarImage}
                  />
              ) : (
                  <Text style={styles.largeAvatarText}>
                    {`${student?.firstName || '?'} ${student?.lastName || ''}`.trim().charAt(0).toUpperCase()}
                  </Text>
              )}
            </View>
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>
                {`${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown Student'}
              </Text>
              <Text style={styles.studentDetail}>ID: {student?.studentId || 'Not available'}</Text>
              <Text style={styles.studentDetail}>Email: {student?.email || 'Not available'}</Text>
              {student?.age && <Text style={styles.studentDetail}>Age: {student.age}</Text>}
              {student?.year && <Text style={styles.studentDetail}>Year: {student.year}</Text>}
              {student?.gpa && <Text style={styles.studentDetail}>GPA: {student.gpa}</Text>}
            </View>
          </View>
        </View>

        {/* Concern Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Concern Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category:</Text>
            <Text style={styles.detailValue}>{currentConcern?.genre || 'Not specified'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>{currentConcern?.concernType || 'Normal Concern'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Submitted:</Text>
            <Text style={styles.detailValue}>{formatDate(currentConcern?.createdAt)}</Text>
          </View>

          {currentConcern?.medicalReport && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medical Report:</Text>
              <Text style={styles.detailValue}>{currentConcern.medicalReport.filename}</Text>
            </View>
          )}

          <View style={[styles.detailRow, { alignItems: 'flex-start', paddingVertical: 12 }]}>
            <Text style={[styles.detailLabel, { marginTop: 0 }]}>Description:</Text>
          </View>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionText}>{currentConcern?.description || 'No description'}</Text>
          </View>
        </View>

        {/* Admin Reply Section */}
        <View style={styles.card}>
          <View style={styles.replyHeader}>
            <Text style={styles.cardTitle}>Admin Reply</Text>
            {currentConcern?.adminReply && !isEditing && (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Ionicons name="pencil" size={18} color="#dc2626" />
              </TouchableOpacity>
            )}
          </View>

          {currentConcern?.adminReply && !isEditing ? (
            <>
              <View style={styles.replyBox}>
                <Text style={styles.replyText}>{currentConcern.adminReply}</Text>
              </View>
              <Text style={styles.replyDate}>Replied on: {formatDate(currentConcern?.repliedAt)}</Text>
              <TouchableOpacity
                style={styles.deleteReplyBtn}
                onPress={handleDeleteReply}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteReplyText}>Delete Reply</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.replyLabel}>
                {currentConcern?.adminReply ? 'Edit your reply' : 'Write a reply to this concern'}
              </Text>
              <TextInput
                style={styles.replyInput}
                placeholder="Enter your response..."
                multiline
                numberOfLines={6}
                value={reply}
                onChangeText={setReply}
                placeholderTextColor="#cbd5e1"
                editable={!loading}
              />
              <View style={styles.replyActions}>
                {isEditing && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setIsEditing(false);
                      setReply(currentConcern?.adminReply || '');
                    }}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                  onPress={handleReply}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#ffffff" />
                      <Text style={styles.submitText}>
                        {currentConcern?.adminReply ? 'Update Reply' : 'Send Reply'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusBarText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteConcernBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  deleteConcernText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  card: {
    marginHorizontal: 14,
    marginVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  studentCard: {
    flexDirection: 'row',
    gap: 12,
  },
  largeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  largeAvatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 24,
  },
  studentDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  studentDetail: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 3,
  },
  detailRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailLabel: {
    flex: 0.35,
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  detailValue: {
    flex: 0.65,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  descriptionBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#475569',
    fontWeight: '500',
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  replyLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  replyBox: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#1e7e34',
    fontWeight: '500',
  },
  replyDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
    marginBottom: 10,
  },
  replyInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  replyActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  submitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  deleteReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  deleteReplyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ef4444',
  },
  errorBanner: {
    marginHorizontal: 14,
    marginVertical: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fee2e2',
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: '#7f1d1d',
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalList: {
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalItemActive: {
    backgroundColor: '#fef2f2',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalItemTextActive: {
    color: '#dc2626',
    fontWeight: '700',
  },
});
