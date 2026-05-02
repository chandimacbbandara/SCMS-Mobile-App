import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

  const [logoutScale] = useState(new Animated.Value(1));
  const handleLogoutPressIn = () => Animated.spring(logoutScale, { toValue: 0.9, useNativeDriver: true }).start();
  const handleLogoutPressOut = () => Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true }).start();

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing) {
        await updateNotice(currentNoticeId, { title: title.trim(), message: message.trim() });
      } else {
        await createNotice({ title: title.trim(), message: message.trim() });
      }
      resetForm();
      loadNotices();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (notice) => {
    setIsEditing(true);
    setCurrentNoticeId(notice._id);
    setTitle(notice.title);
    setMessage(notice.message);
  };

  const handleDelete = (id) => {
    Alert.alert('Delete Broadcast', 'Remove this notice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteNotice(id); loadNotices(); } catch (e) { Alert.alert('Error', e.message); }
      }}
    ]);
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentNoticeId(null);
    setTitle('');
    setMessage('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scrollWrap}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotices(true)} tintColor="#ffffff" />}
        >
          {/* ── Premium Header ── */}
          <LinearGradient
            colors={['#1e293b', '#0f172a', '#7f1d1d']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerHero}
          >
            <View style={styles.headerTop}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Ionicons name="chevron-back" size={20} color="#ffffff" />
              </TouchableOpacity>
              <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
                <TouchableOpacity 
                  style={styles.logoutBtn} 
                  onPress={logout} 
                  onPressIn={handleLogoutPressIn}
                  onPressOut={handleLogoutPressOut}
                  activeOpacity={1}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ffffff" />
                </TouchableOpacity>
              </Animated.View>
            </View>

            <View style={styles.headerContent}>
              <View style={styles.badge}>
                <Ionicons name="megaphone" size={12} color="#fca5a5" />
                <Text style={styles.badgeText}>Broadcast Center</Text>
              </View>
              <Text style={styles.headerTitle}>{isEditing ? 'Update Notice' : 'New Broadcast'}</Text>
              <Text style={styles.headerSub}>Instantly notify all students with important updates.</Text>
            </View>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.card}>
              <Text style={styles.inputLabel}>Message Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g. System Maintenance" style={styles.input} />
              
              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Broadcast Content</Text>
              <TextInput value={message} onChangeText={setMessage} placeholder="Type your announcement..." style={[styles.input, styles.textArea]} multiline />
              
              <View style={styles.formActions}>
                <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator size="small" color="#ffffff" /> : (
                    <>
                      <Ionicons name={isEditing ? "save-outline" : "send-outline"} size={18} color="#ffffff" />
                      <Text style={styles.submitBtnText}>{isEditing ? 'Update' : 'Send Now'}</Text>
                    </>
                  )}
                </TouchableOpacity>
                {isEditing && (
                  <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sent History</Text>
              <View style={styles.countBadge}><Text style={styles.countText}>{notices.length}</Text></View>
            </View>

            {loading && !refreshing ? (
              <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
            ) : notices.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="mail-unread-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No broadcasts sent yet</Text>
              </View>
            ) : (
              notices.map(item => (
                <View key={item._id} style={styles.noticeCard}>
                  <View style={styles.noticeTop}>
                    <View style={styles.iconBox}><Ionicons name="megaphone-outline" size={20} color="#dc2626" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.noticeTitle}>{item.title}</Text>
                      <Text style={styles.noticeDate}>{formatDateTime(item.createdAt)}</Text>
                    </View>
                  </View>
                  <Text style={styles.noticeBody}>{item.message}</Text>
                  <View style={styles.noticeFooter}>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(item)}>
                      <Ionicons name="create-outline" size={16} color="#64748b" />
                      <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item._id)}>
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
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
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollWrap: { paddingBottom: 30 },
  headerHero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(220,38,38,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginBottom: 10 },
  badgeText: { color: '#fca5a5', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginLeft: 6 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  body: { paddingHorizontal: 16, marginTop: -20 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3, marginBottom: 24 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 14, padding: 14, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  textArea: { height: 100, textAlignVertical: 'top' },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 24 },
  submitBtn: { flex: 1, backgroundColor: '#dc2626', height: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  cancelBtn: { padding: 12 },
  cancelText: { color: '#64748b', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a' },
  countBadge: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  countText: { color: '#dc2626', fontSize: 11, fontWeight: '800' },
  noticeCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  noticeTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  noticeDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  noticeBody: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16 },
  noticeFooter: { flexDirection: 'row', gap: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#94a3b8' },
});
