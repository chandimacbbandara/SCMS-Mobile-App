import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

function isValidEmail(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(email || '').trim());
}

function isStrongAdminPassword(password) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{12,}$/.test(String(password || ''));
}

function isValidUsername(username) {
  return /^[A-Za-z0-9._-]{3,30}$/.test(String(username || '').trim());
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function OwnerAdminWorkspaceScreen({ navigation }) {
  const { token, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('create');
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [accountRole, setAccountRole] = useState('admin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  const [sendMessage, setSendMessage] = useState('');
  const [sendMessageType, setSendMessageType] = useState('info');
  const [verifyMessage, setVerifyMessage] = useState('');
  const [verifyMessageType, setVerifyMessageType] = useState('info');
  const [createMessage, setCreateMessage] = useState('');
  const [createMessageType, setCreateMessageType] = useState('info');

  const [editingAdminId, setEditingAdminId] = useState(null);
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmPassword, setEditConfirmPassword] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [manageMessage, setManageMessage] = useState('');
  const [manageMessageType, setManageMessageType] = useState('info');

  const loadAdmins = useCallback(async (isRefresh) => {
    if (!token) {
      setLoadingAdmins(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoadingAdmins(true);
    }

    try {
      const response = await apiRequest('/auth/owner/admin/list', {
        method: 'GET',
        token,
      });
      setAdmins(Array.isArray(response.admins) ? response.admins : []);
    } catch (error) {
      setCreateMessage(error.message || 'Failed to load staff accounts');
      setCreateMessageType('error');
    } finally {
      setLoadingAdmins(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdmins(false);
  }, [loadAdmins]);

  const createStepState = useMemo(() => {
    if (emailVerified) {
      return 3;
    }

    if (emailCodeSent) {
      return 2;
    }

    return 1;
  }, [emailCodeSent, emailVerified]);

  const isCredentialsEnabled = emailVerified;

  async function handleSendCode() {
    const value = email.trim().toLowerCase();

    setSendMessage('');
    setVerifyMessage('');
    setCreateMessage('');

    if (!isValidEmail(value)) {
      setSendMessageType('error');
      setSendMessage('Please enter a valid account email.');
      return;
    }

    setSendLoading(true);

    try {
      const response = await apiRequest('/auth/owner/admin/send-code', {
        method: 'POST',
        token,
        body: { email: value },
      });

      setEmail(value);
      setEmailCodeSent(true);
      setEmailVerified(false);
      setCode('');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setSendMessageType('ok');
      setSendMessage(response.message || 'Verification code sent successfully.');
    } catch (error) {
      setSendMessageType('error');
      setSendMessage(error.message || 'Failed to send code');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleVerifyCode() {
    const value = email.trim().toLowerCase();
    const codeValue = code.trim();

    setVerifyMessage('');
    setCreateMessage('');

    if (!isValidEmail(value)) {
      setVerifyMessageType('error');
      setVerifyMessage('Enter a valid account email first.');
      return;
    }

    if (!codeValue) {
      setVerifyMessageType('error');
      setVerifyMessage('Enter the 6-digit code sent to account email.');
      return;
    }

    setVerifyLoading(true);

    try {
      const response = await apiRequest('/auth/owner/admin/verify-code', {
        method: 'POST',
        token,
        body: { email: value, code: codeValue },
      });

      setEmailVerified(true);
      setVerifyMessageType('ok');
      setVerifyMessage(response.message || 'Email verified successfully.');
    } catch (error) {
      setEmailVerified(false);
      setVerifyMessageType('error');
      setVerifyMessage(error.message || 'Failed to verify code');
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleCreateAdmin() {
    const emailValue = email.trim().toLowerCase();
    const usernameValue = username.trim();

    setCreateMessage('');

    if (!emailVerified) {
      setCreateMessageType('error');
      setCreateMessage('Please verify account email before account creation.');
      return;
    }

    if (!isValidUsername(usernameValue)) {
      setCreateMessageType('error');
      setCreateMessage('Username must be 3-30 chars and contain letters, numbers, dot, underscore, or hyphen.');
      return;
    }

    if (!isStrongAdminPassword(password)) {
      setCreateMessageType('error');
      setCreateMessage('Password must be 12+ chars with uppercase, lowercase, number, and special character.');
      return;
    }

    if (password !== confirmPassword) {
      setCreateMessageType('error');
      setCreateMessage('Password and confirm password do not match.');
      return;
    }

    setCreateLoading(true);

    try {
      const roleLabel = accountRole === 'consulter' ? 'Consulter' : 'Admin';

      const response = await apiRequest('/auth/owner/admin/create', {
        method: 'POST',
        token,
        body: {
          email: emailValue,
          username: usernameValue,
          role: accountRole,
          password,
          confirmPassword,
        },
      });

      setCreateMessageType('ok');
      setCreateMessage(response.message || `${roleLabel} account created successfully.`);

      setEmail('');
      setCode('');
      setUsername('');
      setAccountRole('admin');
      setPassword('');
      setConfirmPassword('');
      setEmailCodeSent(false);
      setEmailVerified(false);
      setSendMessage('');
      setVerifyMessage('');

      await loadAdmins(false);
      setActiveTab('manage');
    } catch (error) {
      setCreateMessageType('error');
      setCreateMessage(error.message || 'Failed to create account');
    } finally {
      setCreateLoading(false);
    }
  }

  function startEditAdmin(admin) {
    setEditingAdminId(admin.id || null);
    setEditEmail(String(admin.email || ''));
    setEditUsername(String(admin.username || ''));
    setEditNewPassword('');
    setEditConfirmPassword('');
    setManageMessage('');
  }

  function cancelEditAdmin() {
    setEditingAdminId(null);
    setEditEmail('');
    setEditUsername('');
    setEditNewPassword('');
    setEditConfirmPassword('');
  }

  async function handleUpdateAdmin() {
    const adminId = String(editingAdminId || '').trim();
    const emailValue = editEmail.trim().toLowerCase();
    const usernameValue = editUsername.trim();

    setManageMessage('');

    if (!adminId) {
      setManageMessageType('error');
      setManageMessage('Please select an account to update.');
      return;
    }

    if (!isValidEmail(emailValue)) {
      setManageMessageType('error');
      setManageMessage('Please enter a valid account email.');
      return;
    }

    if (!isValidUsername(usernameValue)) {
      setManageMessageType('error');
      setManageMessage('Username must be 3-30 chars and contain letters, numbers, dot, underscore, or hyphen.');
      return;
    }

    if (editNewPassword || editConfirmPassword) {
      if (!isStrongAdminPassword(editNewPassword)) {
        setManageMessageType('error');
        setManageMessage('New password must be 12+ chars with uppercase, lowercase, number, and special character.');
        return;
      }

      if (editNewPassword !== editConfirmPassword) {
        setManageMessageType('error');
        setManageMessage('New password and confirm password do not match.');
        return;
      }
    }

    setUpdateLoading(true);

    try {
      const response = await apiRequest(`/auth/owner/admin/${adminId}`, {
        method: 'PATCH',
        token,
        body: {
          email: emailValue,
          username: usernameValue,
          newPassword: editNewPassword,
          confirmPassword: editConfirmPassword,
        },
      });

      setManageMessageType('ok');
      setManageMessage(response.message || 'Admin account updated successfully.');

      await loadAdmins(false);
      cancelEditAdmin();
    } catch (error) {
      setManageMessageType('error');
      setManageMessage(error.message || 'Failed to update account');
    } finally {
      setUpdateLoading(false);
    }
  }

  async function performDeleteAdmin(adminId) {
    setDeleteLoadingId(adminId);
    setManageMessage('');

    try {
      const response = await apiRequest(`/auth/owner/admin/${adminId}`, {
        method: 'DELETE',
        token,
      });

      setManageMessageType('ok');
      setManageMessage(response.message || 'Admin account deleted successfully.');

      if (editingAdminId === adminId) {
        cancelEditAdmin();
      }

      await loadAdmins(false);
    } catch (error) {
      setManageMessageType('error');
      setManageMessage(error.message || 'Failed to delete account');
    } finally {
      setDeleteLoadingId(null);
    }
  }

  function handleDeleteAdmin(admin) {
    const adminId = String(admin.id || '').trim();
    if (!adminId) {
      setManageMessageType('error');
      setManageMessage('Invalid account.');
      return;
    }

    Alert.alert(
      'Delete Account',
      `Delete ${admin.username || 'this account'} account? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            performDeleteAdmin(adminId);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAdmins(true)} tintColor="#b4233a" />}
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

        <LinearGradient
          colors={['#0f172a', '#1b2c42', '#144966']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="shield-outline" size={12} color="#ffd0d7" />
            <Text style={styles.heroBadgeText}>Owner staff workspace</Text>
          </View>

          <Text style={styles.heroTitle}>Create and Manage Staff Accounts</Text>
          <Text style={styles.heroSub}>
            Create Normal Admin or Consulter accounts, verify emails, and manage all support staff from one mobile workspace.
          </Text>
        </LinearGradient>

        <View style={styles.tabWrap}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'create' ? styles.tabBtnActive : null]}
            onPress={() => setActiveTab('create')}
            activeOpacity={0.9}
          >
            <Ionicons name="person-add-outline" size={16} color={activeTab === 'create' ? '#8f1d30' : '#475569'} />
            <Text style={[styles.tabText, activeTab === 'create' ? styles.tabTextActive : null]}>Create Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'manage' ? styles.tabBtnActive : null]}
            onPress={() => setActiveTab('manage')}
            activeOpacity={0.9}
          >
            <Ionicons name="people-outline" size={16} color={activeTab === 'manage' ? '#8f1d30' : '#475569'} />
            <Text style={[styles.tabText, activeTab === 'manage' ? styles.tabTextActive : null]}>Manage Staff</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'create' ? (
          <>
            <View style={styles.stepGrid}>
              <View style={[styles.stepChip, createStepState === 1 ? styles.stepChipActive : null, createStepState > 1 ? styles.stepChipDone : null]}>
                <Text style={styles.stepNo}>1</Text>
                <Text style={styles.stepText}>Send code to account email</Text>
              </View>
              <View style={[styles.stepChip, createStepState === 2 ? styles.stepChipActive : null, createStepState > 2 ? styles.stepChipDone : null]}>
                <Text style={styles.stepNo}>2</Text>
                <Text style={styles.stepText}>Verify email code</Text>
              </View>
              <View style={[styles.stepChip, createStepState === 3 ? styles.stepChipActive : null]}>
                <Text style={styles.stepNo}>3</Text>
                <Text style={styles.stepText}>Create account credentials</Text>
              </View>
            </View>

            <View style={styles.infoStrip}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#1f3a76" />
              <Text style={styles.infoStripText}>Only verified emails can be used for creating Normal Admin or Consulter accounts.</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="mail-outline" size={17} color="#ffffff" />
                <Text style={styles.cardHeaderText}>Step 1: Email Verification</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.inputLabel}>Account Email</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setEmailCodeSent(false);
                      setEmailVerified(false);
                    }}
                    placeholder="staff@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, styles.inlineInput]}
                  />
                  <TouchableOpacity style={styles.primaryBtnSmall} onPress={handleSendCode} disabled={sendLoading} activeOpacity={0.9}>
                    {sendLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnSmallText}>Send Code</Text>}
                  </TouchableOpacity>
                </View>
                {!!sendMessage && (
                  <Text style={[styles.feedbackText, sendMessageType === 'ok' ? styles.feedbackOk : styles.feedbackError]}>{sendMessage}</Text>
                )}

                <Text style={[styles.inputLabel, styles.marginTop]}>Verification Code</Text>
                <View style={styles.inlineRow}>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="6-digit code"
                    keyboardType="number-pad"
                    style={[styles.input, styles.inlineInput]}
                    editable={emailCodeSent}
                    maxLength={6}
                  />
                  <TouchableOpacity
                    style={[styles.primaryBtnSmall, !emailCodeSent ? styles.btnDisabled : null]}
                    onPress={handleVerifyCode}
                    disabled={!emailCodeSent || verifyLoading}
                    activeOpacity={0.9}
                  >
                    {verifyLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.primaryBtnSmallText}>Verify</Text>}
                  </TouchableOpacity>
                </View>
                {!!verifyMessage && (
                  <Text style={[styles.feedbackText, verifyMessageType === 'ok' ? styles.feedbackOk : styles.feedbackError]}>{verifyMessage}</Text>
                )}
              </View>
            </View>

            <View style={styles.card}>
              <View style={[styles.cardHeader, styles.cardHeaderDark]}>
                <Ionicons name="id-card-outline" size={17} color="#ffffff" />
                <Text style={styles.cardHeaderText}>Step 2: Create Credentials</Text>
              </View>

              <View style={[styles.cardBody, !isCredentialsEnabled ? styles.disabledSection : null]}>
                <Text style={styles.inputLabel}>Account Role</Text>
                <View style={styles.roleRow}>
                  <TouchableOpacity
                    style={[styles.roleBtn, accountRole === 'admin' ? styles.roleBtnActive : null]}
                    onPress={() => setAccountRole('admin')}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="shield-checkmark-outline" size={14} color={accountRole === 'admin' ? '#9f1239' : '#475569'} />
                    <Text style={[styles.roleBtnText, accountRole === 'admin' ? styles.roleBtnTextActive : null]}>Normal Admin</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.roleBtn, accountRole === 'consulter' ? styles.roleBtnActive : null]}
                    onPress={() => setAccountRole('consulter')}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="medkit-outline" size={14} color={accountRole === 'consulter' ? '#9f1239' : '#475569'} />
                    <Text style={[styles.roleBtnText, accountRole === 'consulter' ? styles.roleBtnTextActive : null]}>Consulter</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="admin_username"
                  autoCapitalize="none"
                  style={styles.input}
                  editable={isCredentialsEnabled}
                />

                <Text style={[styles.inputLabel, styles.marginTop]}>Password</Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Strong password"
                  secureTextEntry
                  style={styles.input}
                  editable={isCredentialsEnabled}
                />

                <Text style={[styles.inputLabel, styles.marginTop]}>Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter password"
                  secureTextEntry
                  style={styles.input}
                  editable={isCredentialsEnabled}
                />

                <Text style={styles.hintText}>Password must be at least 12 chars with uppercase, lowercase, number, and special character.</Text>

                <TouchableOpacity
                  style={[styles.primaryBtn, !isCredentialsEnabled ? styles.btnDisabled : null]}
                  onPress={handleCreateAdmin}
                  disabled={!isCredentialsEnabled || createLoading}
                  activeOpacity={0.9}
                >
                  {createLoading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="person-add-outline" size={16} color="#ffffff" />
                      <Text style={styles.primaryBtnText}>Create {accountRole === 'consulter' ? 'Consulter' : 'Admin'} Account</Text>
                    </>
                  )}
                </TouchableOpacity>

                {!!createMessage && (
                  <Text style={[styles.feedbackText, createMessageType === 'ok' ? styles.feedbackOk : styles.feedbackError]}>{createMessage}</Text>
                )}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeaderPlain}>
              <Text style={styles.cardTitle}>Manage Staff Accounts</Text>
              <Text style={styles.cardSub}>Admin and consulter accounts created from owner workspace are listed here.</Text>
            </View>

            <View style={styles.cardBody}>
              {!!manageMessage && (
                <Text style={[styles.feedbackText, manageMessageType === 'ok' ? styles.feedbackOk : styles.feedbackError]}>{manageMessage}</Text>
              )}

              {loadingAdmins ? (
                <View style={styles.loaderWrap}>
                  <ActivityIndicator size="small" color="#b4233a" />
                  <Text style={styles.loaderCaption}>Loading staff accounts...</Text>
                </View>
              ) : admins.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="people-outline" size={24} color="#94a3b8" />
                  <Text style={styles.emptyTitle}>No Staff Accounts Yet</Text>
                  <Text style={styles.emptyText}>Create your first account from the Create Staff tab.</Text>
                </View>
              ) : (
                <View style={styles.adminList}>
                  {admins.map((admin, index) => {
                    const isEditing = editingAdminId === admin.id;

                    return (
                      <View key={admin.id || `${admin.email}-${index}`} style={styles.adminItem}>
                        <View style={styles.adminTopRow}>
                          <View style={styles.adminAvatar}>
                            <Text style={styles.adminAvatarText}>{String(admin.username || 'A').slice(0, 1).toUpperCase()}</Text>
                          </View>
                          <View style={styles.adminMeta}>
                            <Text style={styles.adminName}>{admin.username || 'Account'}</Text>
                            <Text style={styles.adminEmail}>{admin.email || 'Not available'}</Text>
                          </View>
                        </View>

                        <View style={styles.metaPillRow}>
                          <View style={styles.metaPill}>
                            <Ionicons name="shield-checkmark-outline" size={11} color="#51647a" />
                            <Text style={styles.metaPillText}>{admin.role || 'admin'}</Text>
                          </View>
                          <View style={styles.metaPill}>
                            <Ionicons name="time-outline" size={11} color="#51647a" />
                            <Text style={styles.metaPillText}>{formatDateTime(admin.createdAt)}</Text>
                          </View>
                        </View>

                        <View style={styles.manageActionsRow}>
                          <TouchableOpacity
                            style={[styles.actionBtn, styles.updateBtn]}
                            onPress={() => {
                              if (isEditing) {
                                cancelEditAdmin();
                              } else {
                                startEditAdmin(admin);
                              }
                            }}
                            activeOpacity={0.9}
                          >
                            <Ionicons name={isEditing ? 'close-outline' : 'create-outline'} size={14} color="#ffffff" />
                            <Text style={styles.actionBtnText}>{isEditing ? 'Close' : 'Update'}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.deleteBtn, deleteLoadingId === admin.id ? styles.btnDisabled : null]}
                            onPress={() => handleDeleteAdmin(admin)}
                            disabled={deleteLoadingId === admin.id}
                            activeOpacity={0.9}
                          >
                            {deleteLoadingId === admin.id ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <>
                                <Ionicons name="trash-outline" size={14} color="#ffffff" />
                                <Text style={styles.actionBtnText}>Delete</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>

                        {isEditing && (
                          <View style={styles.editPanel}>
                            <Text style={styles.editPanelTitle}>Update Account Details</Text>

                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                              value={editEmail}
                              onChangeText={setEditEmail}
                              placeholder="staff@example.com"
                              keyboardType="email-address"
                              autoCapitalize="none"
                              style={styles.input}
                            />

                            <Text style={[styles.inputLabel, styles.marginTop]}>Username</Text>
                            <TextInput
                              value={editUsername}
                              onChangeText={setEditUsername}
                              placeholder="admin_username"
                              autoCapitalize="none"
                              style={styles.input}
                            />

                            <Text style={[styles.inputLabel, styles.marginTop]}>New Password (Optional)</Text>
                            <TextInput
                              value={editNewPassword}
                              onChangeText={setEditNewPassword}
                              placeholder="Leave blank to keep current"
                              secureTextEntry
                              style={styles.input}
                            />

                            <Text style={[styles.inputLabel, styles.marginTop]}>Confirm New Password</Text>
                            <TextInput
                              value={editConfirmPassword}
                              onChangeText={setEditConfirmPassword}
                              placeholder="Re-enter new password"
                              secureTextEntry
                              style={styles.input}
                            />

                            <View style={styles.editActionRow}>
                              <TouchableOpacity
                                style={[styles.primaryBtn, styles.editSaveBtn]}
                                onPress={handleUpdateAdmin}
                                disabled={updateLoading}
                                activeOpacity={0.9}
                              >
                                {updateLoading ? (
                                  <ActivityIndicator size="small" color="#ffffff" />
                                ) : (
                                  <>
                                    <Ionicons name="save-outline" size={16} color="#ffffff" />
                                    <Text style={styles.primaryBtnText}>Save Changes</Text>
                                  </>
                                )}
                              </TouchableOpacity>

                              <TouchableOpacity style={styles.cancelBtn} onPress={cancelEditAdmin} activeOpacity={0.9}>
                                <Ionicons name="close-outline" size={16} color="#475569" />
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f7fb',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ghostBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ghostBtnText: {
    marginLeft: 4,
    color: '#122033',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutBtn: {
    borderRadius: 999,
    backgroundColor: '#b4233a',
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadgeText: {
    marginLeft: 5,
    color: '#ffd0d7',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 7,
    lineHeight: 31,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
  },
  tabWrap: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d7e1ed',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 7,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 7,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    borderColor: '#f3bdc6',
  },
  tabText: {
    marginLeft: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#8f1d30',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  roleBtn: {
    flex: 1,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#c8d5e2',
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBtnActive: {
    borderColor: '#f3bdc6',
    backgroundColor: '#fff6f8',
  },
  roleBtnText: {
    marginLeft: 6,
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
  roleBtnTextActive: {
    color: '#9f1239',
  },
  stepGrid: {
    gap: 9,
    marginBottom: 10,
  },
  stepChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepChipActive: {
    borderColor: '#f5c2cb',
    backgroundColor: '#fff6f8',
  },
  stepChipDone: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },
  stepNo: {
    width: 23,
    height: 23,
    borderRadius: 999,
    backgroundColor: '#fee2e2',
    color: '#9f1239',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    marginRight: 8,
  },
  stepText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  infoStrip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cfe0ff',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoStripText: {
    marginLeft: 8,
    color: '#1f3a76',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 17,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7e1ed',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardHeader: {
    backgroundColor: '#b4233a',
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderDark: {
    backgroundColor: '#8f1d30',
  },
  cardHeaderText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeaderPlain: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef6',
    backgroundColor: '#fbfdff',
  },
  cardTitle: {
    color: '#122033',
    fontSize: 15,
    fontWeight: '900',
  },
  cardSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 13,
  },
  disabledSection: {
    opacity: 0.64,
  },
  inputLabel: {
    color: '#324256',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  input: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#c8d5e2',
    backgroundColor: '#ffffff',
    color: '#122033',
    paddingHorizontal: 11,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  marginTop: {
    marginTop: 10,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineInput: {
    flex: 1,
  },
  primaryBtnSmall: {
    borderRadius: 11,
    backgroundColor: '#8f1d30',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnSmallText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  primaryBtn: {
    marginTop: 11,
    borderRadius: 12,
    backgroundColor: '#b4233a',
    minHeight: 49,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.65,
  },
  hintText: {
    marginTop: 7,
    color: '#4f6178',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  feedbackText: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
  },
  feedbackOk: {
    color: '#15803d',
  },
  feedbackError: {
    color: '#b91c1c',
  },
  loaderWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderCaption: {
    marginTop: 7,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    marginTop: 8,
    color: '#1f2937',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  adminList: {
    gap: 10,
  },
  adminItem: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    padding: 11,
  },
  adminTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffe8ec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminAvatarText: {
    color: '#9f1239',
    fontSize: 14,
    fontWeight: '900',
  },
  adminMeta: {
    marginLeft: 9,
    flex: 1,
  },
  adminName: {
    color: '#112034',
    fontSize: 14,
    fontWeight: '900',
  },
  adminEmail: {
    marginTop: 1,
    color: '#4f6178',
    fontSize: 12,
    fontWeight: '600',
  },
  metaPillRow: {
    marginTop: 9,
    gap: 7,
  },
  metaPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8e4ef',
    backgroundColor: '#f8fbff',
    paddingHorizontal: 9,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaPillText: {
    marginLeft: 5,
    color: '#51647a',
    fontSize: 11,
    fontWeight: '700',
  },
  manageActionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 39,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  updateBtn: {
    backgroundColor: '#1d4ed8',
  },
  deleteBtn: {
    backgroundColor: '#be123c',
  },
  actionBtnText: {
    marginLeft: 5,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  editPanel: {
    marginTop: 10,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#f8fbff',
    padding: 10,
  },
  editPanelTitle: {
    color: '#112034',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
  },
  editActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editSaveBtn: {
    marginTop: 0,
    flex: 1,
    minHeight: 44,
  },
  cancelBtn: {
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#d8e1ec',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    marginLeft: 4,
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
  },
});
