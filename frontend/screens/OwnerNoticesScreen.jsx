import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { apiRequest } from '../lib/api';

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

export default function OwnerNoticesScreen({ navigation }) {
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'create'
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackType, setFeedbackType] = useState('info');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const loadNotices = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await apiRequest('/notices', { method: 'GET', token });
      setNotices(response.notices || []);
    } catch (error) {
      setFeedbackMsg(error.message || 'Failed to load notices');
      setFeedbackType('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadNotices(false);
  }, [loadNotices]);

  async function handleCreateNotice() {
    setFeedbackMsg('');
    if (!title.trim() || !message.trim()) {
      setFeedbackMsg('Title and Message are required.');
      setFeedbackType('error');
      return;
    }

    setCreateLoading(true);
    try {
      await apiRequest('/notices', {
        method: 'POST',
        token,
        body: { title: title.trim(), message: message.trim() },
      });
      setFeedbackMsg('Notice broadcasted successfully.');
      setFeedbackType('ok');
      setTitle('');
      setMessage('');
      setActiveTab('list');
      loadNotices(false);
    } catch (error) {
      setFeedbackMsg(error.message || 'Failed to create notice');
      setFeedbackType('error');
    } finally {
      setCreateLoading(false);
    }
  }

  function startEdit(notice) {
    setEditingId(notice._id);
    setEditTitle(notice.title);
    setEditMessage(notice.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditMessage('');
  }

  async function handleUpdateNotice() {
    setFeedbackMsg('');
    if (!editTitle.trim() || !editMessage.trim()) {
      setFeedbackMsg('Title and Message cannot be empty.');
      setFeedbackType('error');
      return;
    }

    setUpdateLoading(true);
    try {
      await apiRequest(`/notices/${editingId}`, {
        method: 'PATCH',
        token,
        body: { title: editTitle.trim(), message: editMessage.trim() },
      });
      setFeedbackMsg('Notice updated successfully.');
      setFeedbackType('ok');
      cancelEdit();
      loadNotices(false);
    } catch (error) {
      setFeedbackMsg(error.message || 'Failed to update notice');
      setFeedbackType('error');
    } finally {
      setUpdateLoading(false);
    }
  }

  async function performDelete(id) {
    setDeleteLoadingId(id);
    setFeedbackMsg('');
    try {
      await apiRequest(`/notices/${id}`, { method: 'DELETE', token });
      setFeedbackMsg('Notice deleted successfully.');
      setFeedbackType('ok');
      if (editingId === id) cancelEdit();
      loadNotices(false);
    } catch (error) {
      setFeedbackMsg(error.message || 'Failed to delete notice');
      setFeedbackType('error');
    } finally {
      setDeleteLoadingId(null);
    }
  }

  function handleDeleteClick(id) {
    Alert.alert('Delete Notice', 'Are you sure you want to delete this notice?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => performDelete(id) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadNotices(true)} tintColor="#b4233a" />}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Ionicons name="chevron-back" size={16} color="#0f172a" />
            <Text style={styles.ghostBtnText}>Owner Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
            <Ionicons name="log-out-outline" size={15} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#0f172a', '#1b2c42', '#0f6ea8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroBadge}>
            <Ionicons name="megaphone-outline" size={12} color="#cce6ff" />
            <Text style={styles.heroBadgeText}>Broadcast Center</Text>
          </View>
          <Text style={styles.heroTitle}>Student Announcements</Text>
          <Text style={styles.heroSub}>Manage broadcast notifications that will be visible to all students in their dashboard.</Text>
        </LinearGradient>

        <View style={styles.tabWrap}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'list' ? styles.tabBtnActive : null]} onPress={() => setActiveTab('list')} activeOpacity={0.9}>
            <Ionicons name="list-outline" size={16} color={activeTab === 'list' ? '#0f6ea8' : '#475569'} />
            <Text style={[styles.tabText, activeTab === 'list' ? styles.tabTextActive : null]}>All Notices</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'create' ? styles.tabBtnActive : null]} onPress={() => setActiveTab('create')} activeOpacity={0.9}>
            <Ionicons name="add-circle-outline" size={16} color={activeTab === 'create' ? '#0f6ea8' : '#475569'} />
            <Text style={[styles.tabText, activeTab === 'create' ? styles.tabTextActive : null]}>Create New</Text>
          </TouchableOpacity>
        </View>

        {!!feedbackMsg && (
          <View style={[styles.feedbackBanner, feedbackType === 'ok' ? styles.feedbackBannerOk : styles.feedbackBannerError]}>
            <Ionicons name={feedbackType === 'ok' ? 'checkmark-circle' : 'alert-circle'} size={18} color={feedbackType === 'ok' ? '#15803d' : '#b91c1c'} />
            <Text style={[styles.feedbackBannerText, { color: feedbackType === 'ok' ? '#15803d' : '#b91c1c' }]}>{feedbackMsg}</Text>
          </View>
        )}

        {activeTab === 'create' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="megaphone" size={17} color="#ffffff" />
              <Text style={styles.cardHeaderText}>New Broadcast Notice</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.inputLabel}>Notice Title</Text>
              <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Important Update for Semester 2" style={styles.input} />

              <Text style={[styles.inputLabel, styles.marginTop]}>Message Content</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="Type the full announcement message here..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />

              <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateNotice} disabled={createLoading} activeOpacity={0.9}>
                {createLoading ? <ActivityIndicator size="small" color="#ffffff" /> : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#ffffff" />
                    <Text style={styles.primaryBtnText}>Broadcast Notice</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color="#0f6ea8" />
                <Text style={styles.loaderCaption}>Loading notices...</Text>
              </View>
            ) : notices.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Notices Yet</Text>
                <Text style={styles.emptyText}>Create your first broadcast from the Create New tab.</Text>
              </View>
            ) : (
              notices.map((notice) => {
                const isEditing = editingId === notice._id;
                return (
                  <View key={notice._id} style={styles.noticeCard}>
                    {isEditing ? (
                      <View style={styles.editPanel}>
                        <Text style={styles.editPanelTitle}>Edit Notice</Text>
                        <Text style={styles.inputLabel}>Title</Text>
                        <TextInput value={editTitle} onChangeText={setEditTitle} style={styles.input} />
                        <Text style={[styles.inputLabel, styles.marginTop]}>Message</Text>
                        <TextInput
                          value={editMessage}
                          onChangeText={setEditMessage}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          style={[styles.input, styles.textAreaSmall]}
                        />
                        <View style={styles.editActionRow}>
                          <TouchableOpacity style={[styles.primaryBtnSmall, styles.editSaveBtn]} onPress={handleUpdateNotice} disabled={updateLoading}>
                            {updateLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnSmallText}>Save</Text>}
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.noticeHeader}>
                          <Text style={styles.noticeTitle}>{notice.title}</Text>
                          <Text style={styles.noticeDate}>{formatDateTime(notice.createdAt)}</Text>
                        </View>
                        <Text style={styles.noticeMessage}>{notice.message}</Text>
                        <View style={styles.actionRow}>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(notice)}>
                            <Ionicons name="create-outline" size={16} color="#0f6ea8" />
                            <Text style={[styles.iconBtnText, { color: '#0f6ea8' }]}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteClick(notice._id)} disabled={deleteLoadingId === notice._id}>
                            {deleteLoadingId === notice._id ? <ActivityIndicator size="small" color="#c53030" /> : (
                              <>
                                <Ionicons name="trash-outline" size={16} color="#c53030" />
                                <Text style={[styles.iconBtnText, { color: '#c53030' }]}>Delete</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f7fb' },
  scrollWrap: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 22 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center' },
  ghostBtnText: { marginLeft: 2, color: '#0f172a', fontSize: 13, fontWeight: '700' },
  logoutBtn: { borderRadius: 999, backgroundColor: '#c53030', paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  logoutText: { marginLeft: 4, color: '#ffffff', fontSize: 11, fontWeight: '800' },
  hero: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 18, marginBottom: 14 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  heroBadgeText: { marginLeft: 5, color: '#cce6ff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.7 },
  heroTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900', marginBottom: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, fontWeight: '500' },
  tabWrap: { flexDirection: 'row', borderRadius: 12, backgroundColor: '#e8eef6', padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  tabText: { marginLeft: 6, color: '#475569', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#0f6ea8', fontWeight: '800' },
  feedbackBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginBottom: 14, borderWidth: 1 },
  feedbackBannerOk: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  feedbackBannerError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  feedbackBannerText: { marginLeft: 8, fontSize: 13, fontWeight: '600', flex: 1 },
  card: { borderRadius: 16, backgroundColor: '#ffffff', overflow: 'hidden', borderWidth: 1, borderColor: '#dbe5ef' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f6ea8', paddingHorizontal: 14, paddingVertical: 12 },
  cardHeaderText: { marginLeft: 8, color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cardBody: { padding: 16 },
  inputLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  marginTop: { marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  textArea: { minHeight: 120 },
  textAreaSmall: { minHeight: 80 },
  primaryBtn: { backgroundColor: '#0f6ea8', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  primaryBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800', marginLeft: 8 },
  primaryBtnSmall: { backgroundColor: '#0f6ea8', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnSmallText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  listContainer: { gap: 12 },
  noticeCard: { borderRadius: 12, backgroundColor: '#ffffff', padding: 16, borderWidth: 1, borderColor: '#dbe5ef', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  noticeHeader: { flexDirection: 'column', marginBottom: 8 },
  noticeTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  noticeDate: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  noticeMessage: { fontSize: 14, color: '#334155', lineHeight: 20, marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12, gap: 16 },
  iconBtn: { flexDirection: 'row', alignItems: 'center' },
  iconBtnText: { marginLeft: 4, fontSize: 12, fontWeight: '700' },
  loaderWrap: { padding: 40, alignItems: 'center' },
  loaderCaption: { marginTop: 12, color: '#64748b', fontSize: 13, fontWeight: '600' },
  emptyWrap: { padding: 40, alignItems: 'center' },
  emptyTitle: { marginTop: 12, color: '#334155', fontSize: 16, fontWeight: '800' },
  emptyText: { marginTop: 4, color: '#64748b', fontSize: 13, textAlign: 'center' },
  editPanel: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  editPanelTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 12 },
  editActionRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 8 },
  editSaveBtn: { minWidth: 80 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 12, justifyContent: 'center' },
  cancelBtnText: { color: '#475569', fontSize: 12, fontWeight: '700' },
});
