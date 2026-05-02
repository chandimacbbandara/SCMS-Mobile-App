import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function isValidEmail(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(email || '').trim());
}

function isStrongAdminPassword(password) {
  const value = String(password || '');
  return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value);
}

function isValidUsername(username) {
  const value = String(username || '').trim();
  return /^[A-Za-z0-9._-]{3,30}$/.test(value);
}

function formatDateTime(value) {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OwnerAdminWorkspaceScreen({ navigation }) {
  const { token, logout, user } = useAuth();

  const [activeTab, setActiveTab] = useState('create');
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Creation State
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [accountRole, setAccountRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);

  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Edit State
  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);

  const [logoutScale] = useState(new Animated.Value(1));

  const loadAdmins = useCallback(async (isRefresh = false) => {
    if (!token) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingAdmins(true);
    try {
      const response = await apiRequest('/auth/owner/admin/list', { method: 'GET', token });
      setAdmins(Array.isArray(response.admins) ? response.admins : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAdmins(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => { loadAdmins(false); }, [loadAdmins]);

  const handleLogoutPressIn = () => Animated.spring(logoutScale, { toValue: 0.9, useNativeDriver: true }).start();
  const handleLogoutPressOut = () => Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true }).start();

  const handleTabChange = (tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
    setEditingAdminId(null);
  };

  async function handleSendCode() {
    const val = email.trim().toLowerCase();
    if (!isValidEmail(val)) { Alert.alert('Invalid Email', 'Please enter a valid email.'); return; }
    setSendLoading(true);
    try {
      await apiRequest('/auth/owner/admin/send-code', { method: 'POST', token, body: { email: val } });
      setEmail(val);
      setEmailCodeSent(true);
      Alert.alert('Success', 'Verification code sent to email.');
    } catch (e) { 
      Alert.alert('Verification Error', e.message); 
    }
    finally { setSendLoading(false); }
  }

  async function handleVerifyCode() {
    if (!code.trim()) { Alert.alert('Error', 'Enter code.'); return; }
    setVerifyLoading(true);
    try {
      await apiRequest('/auth/owner/admin/verify-code', { method: 'POST', token, body: { email, code: code.trim() } });
      setEmailVerified(true);
      Alert.alert('Verified', 'Email verified successfully. You can now complete the registration.');
    } catch (e) { Alert.alert('Error', 'Invalid code.'); }
    finally { setVerifyLoading(false); }
  }

  async function handleCreateAdmin() {
    if (!emailVerified) { Alert.alert('Verification Required', 'Please verify the email first.'); return; }
    if (!isValidUsername(username)) { Alert.alert('Error', 'Username must be 3-30 characters.'); return; }
    if (password.length < 12) { Alert.alert('Error', 'Password must be at least 12 characters.'); return; }
    
    setCreateLoading(true);
    try {
      await apiRequest('/auth/owner/admin/create', {
        method: 'POST', token,
        body: { email, username: username.trim(), role: accountRole, password, confirmPassword: password }
      });
      Alert.alert('Success', 'Staff account created successfully.');
      resetCreateForm();
      loadAdmins(false);
      handleTabChange('manage');
    } catch (e) { Alert.alert('Creation Error', e.message); }
    finally { setCreateLoading(false); }
  }

  function resetCreateForm() {
    setEmail(''); setCode(''); setUsername(''); setPassword('');
    setEmailCodeSent(false); setEmailVerified(false);
    setShowCreatePassword(false);
  }

  function startEdit(admin) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEditingAdminId(admin.id);
    setEditUsername(admin.username);
    setEditEmail(admin.email);
    setEditPassword('');
    setShowEditPassword(false);
  }

  async function handleUpdate() {
    setUpdateLoading(true);
    try {
      await apiRequest(`/auth/owner/admin/${editingAdminId}`, {
        method: 'PATCH', token,
        body: { email: editEmail, username: editUsername, newPassword: editPassword, confirmPassword: editPassword }
      });
      Alert.alert('Success', 'Account updated.');
      setEditingAdminId(null);
      loadAdmins(false);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setUpdateLoading(false); }
  }

  async function performDelete(adminId) {
    Alert.alert('Delete Account', 'Permanently remove this account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        setDeleteLoadingId(adminId);
        try { await apiRequest(`/auth/owner/admin/${adminId}`, { method: 'DELETE', token }); loadAdmins(false); }
        catch (e) { Alert.alert('Error', e.message); }
        finally { setDeleteLoadingId(null); }
      }}
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAdmins(true)} tintColor="#ffffff" />}
      >
        <LinearGradient colors={['#1e293b', '#0f172a', '#144966']} style={styles.headerHero}>
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Ionicons name="chevron-back" size={20} color="#ffffff" /></TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout} onPressIn={handleLogoutPressIn} onPressOut={handleLogoutPressOut} activeOpacity={1}>
                <Ionicons name="log-out-outline" size={18} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
          <View style={styles.headerContent}>
            <View style={styles.badge}><Ionicons name="shield-checkmark-outline" size={12} color="#93c5fd" /><Text style={styles.badgeText}>Workspace</Text></View>
            <Text style={styles.headerTitle}>Staff Management</Text>
            <Text style={styles.headerSub}>Manage administrators and consulters.</Text>
          </View>
        </LinearGradient>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'create' && styles.tabBtnActive]} onPress={() => handleTabChange('create')}><Text style={[styles.tabBtnText, activeTab === 'create' && styles.tabBtnTextActive]}>New Account</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'manage' && styles.tabBtnActive]} onPress={() => handleTabChange('manage')}><Text style={[styles.tabBtnText, activeTab === 'manage' && styles.tabBtnTextActive]}>Active Staff</Text></TouchableOpacity>
        </View>

        <View style={styles.body}>
          {activeTab === 'create' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Account Details</Text>
              
              <Text style={styles.inputLabel}>Account Email</Text>
              <View style={styles.inputRow}>
                <TextInput value={email} onChangeText={(v) => { setEmail(v); setEmailCodeSent(false); setEmailVerified(false); }} placeholder="staff@example.com" style={[styles.input, emailVerified && styles.inputDisabled]} editable={!emailVerified} />
                <TouchableOpacity style={styles.inlineActionBtn} onPress={handleSendCode} disabled={sendLoading || emailVerified}>
                  {sendLoading ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={[styles.inlineActionText, emailVerified && { color: '#16a34a' }]}>{emailVerified ? 'Verified' : 'Send Code'}</Text>}
                </TouchableOpacity>
              </View>

              {emailCodeSent && !emailVerified && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.inputLabel}>Verification Code</Text>
                  <View style={styles.inputRow}>
                    <TextInput value={code} onChangeText={setCode} placeholder="Enter 6-digit code" style={styles.input} keyboardType="number-pad" />
                    <TouchableOpacity style={styles.inlineActionBtn} onPress={handleVerifyCode} disabled={verifyLoading}>{verifyLoading ? <ActivityIndicator size="small" color="#dc2626" /> : <Text style={styles.inlineActionText}>Verify Code</Text>}</TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={{ marginTop: 24, opacity: emailVerified ? 1 : 0.6 }}>
                <Text style={styles.inputLabel}>Staff Role</Text>
                <View style={styles.roleGrid}>
                  <TouchableOpacity style={[styles.roleCard, accountRole === 'admin' && styles.roleCardActive]} onPress={() => emailVerified && setAccountRole('admin')} activeOpacity={emailVerified ? 0.7 : 1}>
                    <Ionicons name="shield-outline" size={24} color={accountRole === 'admin' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.roleCardText, accountRole === 'admin' && styles.roleCardTextActive]}>Admin</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roleCard, accountRole === 'consulter' && styles.roleCardActive]} onPress={() => emailVerified && setAccountRole('consulter')} activeOpacity={emailVerified ? 0.7 : 1}>
                    <Ionicons name="medical-outline" size={24} color={accountRole === 'consulter' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.roleCardText, accountRole === 'consulter' && styles.roleCardTextActive]}>Consulter</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Username</Text>
                <TextInput value={username} onChangeText={setUsername} placeholder="e.g. john_doe" style={styles.input} editable={emailVerified} />
                
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>Access Password</Text>
                <View style={styles.passwordInputWrap}>
                  <TextInput value={password} onChangeText={setPassword} placeholder="Min 12 chars, mixed case" secureTextEntry={!showCreatePassword} style={[styles.input, { flex: 1 }]} editable={emailVerified} />
                  <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowCreatePassword(!showCreatePassword)} disabled={!emailVerified}>
                    <Ionicons name={showCreatePassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity style={[styles.submitBtn, !emailVerified && styles.submitBtnDisabled]} onPress={handleCreateAdmin} disabled={createLoading || !emailVerified}>
                  {createLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitBtnText}>{emailVerified ? 'Create Staff Account' : 'Verify Email to Proceed'}</Text>}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {loadingAdmins ? (
                <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
              ) : admins.length === 0 ? (
                <View style={styles.emptyWrap}><Ionicons name="people-outline" size={48} color="#cbd5e1" /><Text style={styles.emptyText}>No staff accounts found</Text></View>
              ) : (
                admins.map(admin => (
                  <View key={admin.id} style={styles.adminCard}>
                    {editingAdminId === admin.id ? (
                      <View>
                        <Text style={styles.editTitle}>Update Account</Text>
                        <Text style={styles.inputLabel}>Username</Text>
                        <TextInput value={editUsername} onChangeText={setEditUsername} style={styles.input} />
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>Email</Text>
                        <TextInput value={editEmail} onChangeText={setEditEmail} style={styles.input} />
                        <Text style={[styles.inputLabel, { marginTop: 10 }]}>New Password (Optional)</Text>
                        <View style={styles.passwordInputWrap}>
                          <TextInput value={editPassword} onChangeText={setEditPassword} placeholder="Leave blank to keep" secureTextEntry={!showEditPassword} style={[styles.input, { flex: 1 }]} />
                          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowEditPassword(!showEditPassword)}>
                            <Ionicons name={showEditPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.editActions}>
                          <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={updateLoading}>{updateLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}</TouchableOpacity>
                          <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditingAdminId(null)}><Text style={styles.cancelEditText}>Cancel</Text></TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={styles.adminCardTop}>
                          <View style={styles.avatar}><Text style={styles.avatarText}>{admin.username?.[0].toUpperCase()}</Text></View>
                          <View style={{ flex: 1 }}><Text style={styles.adminName}>{admin.username}</Text><Text style={styles.adminEmail}>{admin.email}</Text></View>
                          <View style={[styles.roleBadge, { backgroundColor: admin.role === 'consulter' ? '#ecfdf5' : '#eff6ff' }]}><Text style={[styles.roleBadgeText, { color: admin.role === 'consulter' ? '#059669' : '#2563eb' }]}>{admin.role}</Text></View>
                        </View>
                        <View style={styles.adminCardFooter}>
                          <Text style={styles.adminDate}>Joined {formatDateTime(admin.createdAt)}</Text>
                          <View style={{ flexDirection: 'row', gap: 15 }}>
                            <TouchableOpacity onPress={() => startEdit(admin)}><Ionicons name="create-outline" size={18} color="#64748b" /></TouchableOpacity>
                            <TouchableOpacity onPress={() => performDelete(admin.id)} disabled={deleteLoadingId === admin.id}><Ionicons name="trash-outline" size={18} color="#ef4444" /></TouchableOpacity>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </ScrollView>
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
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginBottom: 10 },
  badgeText: { color: '#93c5fd', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginLeft: 6 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -20, marginBottom: 16, gap: 10 },
  tabBtn: { flex: 1, backgroundColor: '#ffffff', paddingVertical: 14, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  tabBtnActive: { backgroundColor: '#dc2626' },
  tabBtnText: { color: '#64748b', fontSize: 13, fontWeight: '800' },
  tabBtnTextActive: { color: '#ffffff' },
  body: { paddingHorizontal: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: { height: 50, backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#0f172a' },
  inputDisabled: { backgroundColor: '#f8fafc', color: '#94a3b8' },
  passwordInputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 14, overflow: 'hidden' },
  eyeBtn: { paddingHorizontal: 12, height: 50, justifyContent: 'center' },
  inlineActionBtn: { justifyContent: 'center', paddingHorizontal: 12 },
  inlineActionText: { color: '#dc2626', fontSize: 13, fontWeight: '800' },
  roleGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  roleCard: { flex: 1, height: 80, borderRadius: 16, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#f1f5f9' },
  roleCardActive: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  roleCardText: { fontSize: 12, fontWeight: '800', color: '#64748b', marginTop: 6 },
  roleCardTextActive: { color: '#ffffff' },
  submitBtn: { backgroundColor: '#dc2626', height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  submitBtnDisabled: { backgroundColor: '#cbd5e1' },
  submitBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  adminCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  editTitle: { fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 16, alignItems: 'center' },
  saveBtn: { flex: 1, backgroundColor: '#dc2626', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cancelEditBtn: { padding: 10 },
  cancelEditText: { color: '#64748b', fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  adminCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#475569' },
  adminName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  adminEmail: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  roleBadgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  adminCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  adminDate: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#94a3b8' },
});
