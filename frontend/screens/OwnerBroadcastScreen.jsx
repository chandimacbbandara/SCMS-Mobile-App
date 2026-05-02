import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
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
import { getNotices, createNotice, updateNotice, deleteNotice } from '../lib/api';

function formatDateTime(value) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OwnerBroadcastScreen({ navigation }) {
  const { token, logout } = useAuth();

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // CRUD State
  const [isEditing, setIsEditing] = useState(false);
  const [currentNoticeId, setCurrentNoticeId] = useState(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadNotices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await getNotices();
      setNotices(response.notices || []);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to load broadcasts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const validate = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for the broadcast.');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Validation Error', 'Please enter a message for the broadcast.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditing) {
        await updateNotice(currentNoticeId, { title: title.trim(), message: message.trim() });
        Alert.alert('Success', 'Broadcast updated successfully');
      } else {
        await createNotice({ title: title.trim(), message: message.trim() });
        Alert.alert('Success', 'Broadcast sent to all students');
      }
      resetForm();
      loadNotices();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to process broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice) => {
    setIsEditing(true);
    setCurrentNoticeId(notice._id);
    setTitle(notice.title);
    setMessage(notice.message);
    // Scroll to top or just focus? In this UI, form is at the top or in a modal?
    // Let's put the form in an expandable section or always at the top.
  };

  const handleDelete = (id) => {
    Alert.alert(
      'Delete Broadcast',
      'Are you sure you want to delete this broadcast? It will no longer be visible to students.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await deleteNotice(id);
              loadNotices();
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete broadcast');
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentNoticeId(null);
    setTitle('');
    setMessage('');
  };

  const renderNoticeItem = ({ item }) => (
    <View style={styles.noticeCard}>
      <View style={styles.noticeHeader}>
        <View style={styles.noticeIconWrap}>
          <Ionicons name="megaphone-outline" size={20} color="#b91c1c" />
        </View>
        <View style={styles.noticeMeta}>
          <Text style={styles.noticeTitle}>{item.title}</Text>
          <Text style={styles.noticeDate}>{formatDateTime(item.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.noticeMessage}>{item.message}</Text>
      <View style={styles.noticeActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
          <Ionicons name="create-outline" size={16} color="#0f172a" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={16} color="#b91c1c" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Broadcast</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadNotices(true)} tintColor="#b91c1c" />
          }
        >
          <LinearGradient
            colors={['#0f172a', '#1b2c42', '#7f1d1d']}
            style={styles.heroCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroBadge}>
              <Ionicons name="radio-outline" size={12} color="#ffd1d8" />
              <Text style={styles.heroBadgeText}>Broadcast Center</Text>
            </View>
            <Text style={styles.heroTitle}>{isEditing ? 'Update Broadcast' : 'New Broadcast'}</Text>
            <Text style={styles.heroSub}>
              Send important updates, news, or alerts to all students instantly.
            </Text>
            
            <View style={styles.formCard}>
              <Text style={styles.label}>Broadcast Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Holiday Notice"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />
              
              <Text style={[styles.label, { marginTop: 15 }]}>Message Body</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Type your message here..."
                placeholderTextColor="#94a3b8"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
              />

              <View style={styles.formActions}>
                <TouchableOpacity 
                  style={[styles.submitBtn, submitting && styles.btnDisabled]} 
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name={isEditing ? "save-outline" : "send-outline"} size={18} color="#ffffff" />
                      <Text style={styles.submitBtnText}>{isEditing ? 'Update Broadcast' : 'Send Broadcast'}</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {isEditing && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>

          <View style={styles.historySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Broadcast History</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notices.length}</Text>
              </View>
            </View>

            {loading && !refreshing ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#b91c1c" />
              </View>
            ) : notices.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No broadcasts sent yet.</Text>
              </View>
            ) : (
              notices.map((item) => (
                <View key={item._id} style={{ marginBottom: 12 }}>
                  {renderNoticeItem({ item })}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#b91c1c',
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
    paddingBottom: 40,
  },
  heroCard: {
    margin: 16,
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroBadgeText: {
    color: '#ffd1d8',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 18,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#7f1d1d',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  historySection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
  },
  noticeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noticeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  noticeMeta: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  noticeDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  noticeMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  noticeActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#b91c1c',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
});
