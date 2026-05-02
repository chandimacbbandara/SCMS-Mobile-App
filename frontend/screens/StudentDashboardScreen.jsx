import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import {
  getStudentConcerns,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../lib/api';

function getInitials(firstName, lastName, email) {
  const f = String(firstName || '').trim();
  const l = String(lastName || '').trim();

  if (f || l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }

  return String(email || 'S').trim().charAt(0).toUpperCase() || 'S';
}

function resolveAssetUrl(apiBaseUrl, pathValue) {
  if (!pathValue) {
    return null;
  }

  if (/^https?:\/\//i.test(pathValue)) {
    return pathValue;
  }

  const base = String(apiBaseUrl || '').replace(/\/api\/?$/, '');
  if (!base) {
    return pathValue;
  }

  return `${base}${String(pathValue).startsWith('/') ? '' : '/'}${pathValue}`;
}

function getNowParts() {
  const now = new Date();

  return {
    date: now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    time: now.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function formatMemberSince(value) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatConcernDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function getConcernStatusLabel(status) {
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

function getConcernStatusColor(status) {
  switch (status) {
    case 'pending':
      return '#f59e0b';
    case 'reviewing':
      return '#3b82f6';
    case 'resolved':
      return '#16a34a';
    case 'rejected':
      return '#ef4444';
    default:
      return '#94a3b8';
  }
}

function getConcernStepIndex(status) {
  switch (status) {
    case 'pending':
      return 0;
    case 'reviewing':
      return 1;
    case 'resolved':
      return 2;
    default:
      return 0;
  }
}

export default function StudentDashboardScreen({ navigation }) {
  const { user, logout, apiBaseUrl, refreshMe } = useAuth();
  const [clock, setClock] = useState(getNowParts());
  const [refreshing, setRefreshing] = useState(false);
  const [initialSyncing, setInitialSyncing] = useState(false);
  const [trackingConcerns, setTrackingConcerns] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [trackingError, setTrackingError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const studentId = user?.id || user?._id;

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(getNowParts());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initialRefresh() {
      setInitialSyncing(true);
      try {
        await refreshMe();
      } catch (error) {
        // Keep dashboard usable even if refresh fails.
      } finally {
        if (isMounted) {
          setInitialSyncing(false);
        }
      }
    }

    initialRefresh();

    return () => {
      isMounted = false;
    };
  }, [refreshMe]);

  const loadConcernTracking = useCallback(
    async (isRefresh = false) => {
      if (!studentId) {
        setTrackingConcerns([]);
        setTrackingLoading(false);
        setTrackingError('');
        return;
      }

      if (!isRefresh) {
        setTrackingLoading(true);
      }

      setTrackingError('');

      try {
        const response = await getStudentConcerns(studentId);
        const data = Array.isArray(response.data) ? response.data : [];
        setTrackingConcerns(data);
      } catch (error) {
        setTrackingError(error.message || 'Failed to load concerns');
      } finally {
        setTrackingLoading(false);
      }
    },
    [studentId]
  );

  const loadNotifications = useCallback(
    async (isRefresh = false) => {
      if (!studentId) {
        setNotifications([]);
        setNotificationsLoading(false);
        setNotificationsError('');
        return;
      }

      if (!isRefresh) {
        setNotificationsLoading(true);
      }

      setNotificationsError('');

      try {
        const response = await getMyNotifications();
        const data = Array.isArray(response.data) ? response.data : [];
        setNotifications(data);
      } catch (error) {
        setNotificationsError(error.message || 'Failed to load notifications');
      } finally {
        setNotificationsLoading(false);
      }
    },
    [studentId]
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshMe(), loadConcernTracking(true), loadNotifications(true)]);
    } catch (error) {
      // No-op: existing data remains visible.
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe, loadConcernTracking, loadNotifications]);

  useEffect(() => {
    loadConcernTracking(false);
    loadNotifications(false);
  }, [loadConcernTracking, loadNotifications]);

  useFocusEffect(
    useCallback(() => {
      loadConcernTracking(true);
      loadNotifications(true);
    }, [loadConcernTracking, loadNotifications])
  );

  const displayName = useMemo(() => {
    const firstName = String(user?.firstName || '').trim();
    const lastName = String(user?.lastName || '').trim();

    if (!firstName && !lastName) {
      return 'Student';
    }

    return `${firstName}${lastName ? ` ${lastName}` : ''}`;
  }, [user?.firstName, user?.lastName]);

  const avatarText = getInitials(user?.firstName, user?.lastName, user?.email);
  const studentPhotoUri = resolveAssetUrl(apiBaseUrl, user?.studentIdPhoto);
  const memberSince = formatMemberSince(user?.createdAt);

  const profileCompletion = useMemo(() => {
    const profileChecks = [
      user?.firstName,
      user?.lastName,
      user?.email,
      user?.studentId,
      user?.studentIdPhoto,
    ];

    const completed = profileChecks.filter((value) => String(value || '').trim() !== '').length;
    return Math.round((completed / profileChecks.length) * 100);
  }, [user?.email, user?.firstName, user?.lastName, user?.studentId, user?.studentIdPhoto]);

  const idPhotoStatus = user?.studentIdPhoto ? 'Uploaded' : 'Missing';

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const activeConcerns = useMemo(() => {
    return trackingConcerns
      .filter((concern) => ['pending', 'reviewing'].includes(String(concern?.status || '').toLowerCase()))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [trackingConcerns]);

  if (initialSyncing && !user) {
    return (
      <SafeAreaView style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#e53935" />
        <Text style={styles.loaderText}>Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#e53935" />}
      >
        <View style={styles.topNavRow}>
          <Text style={styles.topNavTitle}>Student Dashboard</Text>
          <View style={styles.topNavActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.85}
              onPress={() => setShowNotifications(true)}
            >
              <Ionicons name="notifications-outline" size={18} color="#374151" />
              {unreadCount > 0 ? (
                <View style={styles.badgeDot}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.85} onPress={handleRefresh}>
              <Ionicons name="refresh-outline" size={18} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.9}>
              <Ionicons name="log-out-outline" size={16} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient
          colors={['#e53935', '#c62828', '#b71c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroLeft}>
            <View style={styles.heroTagWrap}>
              <View style={styles.heroTagDot} />
              <Text style={styles.heroTag}>Academy of Knowledge Bridge</Text>
            </View>

            <Text style={styles.heroName}>Welcome, {displayName}</Text>
            <Text style={styles.heroSubText}>Your account overview is synced to real profile data.</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="mail-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>{user?.email || 'No email'}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="id-card-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>{user?.studentId || 'No ID'}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="calendar-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>Member since {memberSince}</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroRight}>
            <View style={styles.clockCard}>
              <Text style={styles.clockDate}>{clock.date}</Text>
              <Text style={styles.clockTime}>{clock.time}</Text>
            </View>

            {studentPhotoUri ? (
              <Image source={{ uri: studentPhotoUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{avatarText}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.statusGrid}>
          <View style={styles.statusCard}>
            <Ionicons name="sparkles-outline" size={20} color="#d32f2f" />
            <Text style={styles.statusValue}>{profileCompletion}%</Text>
            <Text style={styles.statusLabel}>Profile Completion</Text>
          </View>

          <View style={styles.statusCard}>
            <Ionicons name="image-outline" size={20} color="#1565c0" />
            <Text style={styles.statusValue}>{idPhotoStatus}</Text>
            <Text style={styles.statusLabel}>ID Photo</Text>
          </View>

          <View style={styles.statusCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#2e7d32" />
            <Text style={styles.statusValue}>Active</Text>
            <Text style={styles.statusLabel}>Account Session</Text>
          </View>
        </View>

        <View style={styles.panelCard}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Account Details</Text>
            <View style={styles.approvedBadge}>
              <View style={styles.approvedDot} />
              <Text style={styles.approvedText}>Live</Text>
            </View>
          </View>

          <View style={styles.profileList}>
            <View style={styles.profileItem}>
              <Ionicons name="person-outline" size={16} color="#e53935" />
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileLabel}>Full Name</Text>
                <Text style={styles.profileValue}>{displayName}</Text>
              </View>
            </View>

            <View style={styles.profileItem}>
              <Ionicons name="mail-outline" size={16} color="#e53935" />
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileLabel}>Email</Text>
                <Text style={styles.profileValue}>{user?.email || '-'}</Text>
              </View>
            </View>

            <View style={styles.profileItem}>
              <Ionicons name="card-outline" size={16} color="#e53935" />
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileLabel}>Student ID</Text>
                <Text style={styles.profileValue}>{user?.studentId || '-'}</Text>
              </View>
            </View>

            <View style={styles.profileItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#e53935" />
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileLabel}>Role</Text>
                <Text style={styles.profileValue}>{user?.role || 'student'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.panelCard, styles.mobileActionPanel]}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Mobile Actions</Text>
            <Text style={styles.panelSubtitle}>Quick controls</Text>
          </View>

          <View style={styles.mobileActionGrid}>
            <TouchableOpacity style={styles.mobileActionBtn} activeOpacity={0.9} onPress={handleRefresh}>
              <Ionicons name="sync-outline" size={18} color="#1565c0" />
              <Text style={styles.mobileActionText}>Refresh</Text>
            </TouchableOpacity>

            <View style={[styles.mobileActionBtn, styles.mobileActionBtnPassive]}>
              <Ionicons name="analytics-outline" size={18} color="#6b7280" />
              <Text style={styles.mobileActionText}>Live Profile</Text>
            </View>

            <View style={[styles.mobileActionBtn, styles.mobileActionBtnPassive]}>
              <Ionicons name="notifications-outline" size={18} color="#6b7280" />
              <Text style={styles.mobileActionText}>Alerts Soon</Text>
            </View>

            <TouchableOpacity style={[styles.mobileActionBtn, styles.mobileActionBtnDanger]} activeOpacity={0.9} onPress={logout}>
              <Ionicons name="log-out-outline" size={18} color="#b71c1c" />
              <Text style={[styles.mobileActionText, styles.mobileActionTextDanger]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.panelCard, styles.trackingPanel]}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Concern Tracking</Text>
            <Text style={styles.panelSubtitle}>
              {activeConcerns.length > 0 ? `${activeConcerns.length} active` : 'All clear'}
            </Text>
          </View>

          {trackingLoading ? (
            <View style={styles.trackingLoader}>
              <ActivityIndicator size="small" color="#e53935" />
              <Text style={styles.trackingLoaderText}>Loading your concerns...</Text>
            </View>
          ) : trackingError ? (
            <View style={styles.trackingErrorCard}>
              <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
              <Text style={styles.trackingErrorText}>{trackingError}</Text>
            </View>
          ) : activeConcerns.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Ionicons name="checkmark-done-circle-outline" size={28} color="#16a34a" />
              <Text style={styles.emptyStateTitle}>No active concerns right now</Text>
              <Text style={styles.emptyStateText}>
                New submissions will appear here until they are reviewed and completed.
              </Text>
            </View>
          ) : (
            <View style={styles.trackingList}>
              {activeConcerns.map((concern) => {
                const statusValue = String(concern.status || 'pending').toLowerCase();
                const statusColor = getConcernStatusColor(statusValue);
                const stepIndex = getConcernStepIndex(statusValue);
                return (
                  <TouchableOpacity
                    key={concern._id || concern.id}
                    style={styles.trackingCard}
                    onPress={() => navigation.navigate('ConcernDetail', { concern })}
                    activeOpacity={0.85}
                  >
                    <View style={styles.trackingHeaderRow}>
                      <View style={styles.trackingTitleWrap}>
                        <Text style={styles.trackingType}>{concern.concernType || 'Concern'}</Text>
                        <Text style={styles.trackingGenre}>{concern.genre || 'General'}</Text>
                      </View>
                      <View
                        style={[
                          styles.trackingStatusPill,
                          { backgroundColor: `${statusColor}22`, borderColor: statusColor },
                        ]}
                      >
                        <Text style={[styles.trackingStatusText, { color: statusColor }]}>
                          {getConcernStatusLabel(statusValue)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.trackingStepsRow}>
                      {['Pending', 'Reviewing', 'Completed'].map((label, index) => {
                        const isActive = index <= stepIndex;
                        return (
                          <View key={label} style={styles.trackingStepItem}>
                            <View
                              style={[
                                styles.trackingStepDot,
                                isActive ? styles.trackingStepDotActive : styles.trackingStepDotIdle,
                              ]}
                            />
                            <Text
                              style={[
                                styles.trackingStepLabel,
                                isActive ? styles.trackingStepLabelActive : styles.trackingStepLabelIdle,
                              ]}
                            >
                              {label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>

                    <Text style={styles.trackingDescription} numberOfLines={2}>
                      {concern.description}
                    </Text>

                    <View style={styles.trackingFooterRow}>
                      <View style={styles.trackingDateWrap}>
                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                        <Text style={styles.trackingDateText}>{formatConcernDate(concern.createdAt)}</Text>
                      </View>
                      <View style={styles.trackingLink}>
                        <Text style={styles.trackingLinkText}>View details</Text>
                        <Ionicons name="chevron-forward" size={14} color="#dc2626" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Ionicons name="close" size={20} color="#0f172a" />
              </TouchableOpacity>
            </View>

            {notificationsLoading ? (
              <View style={styles.modalState}> 
                <ActivityIndicator size="small" color="#e53935" />
                <Text style={styles.modalStateText}>Loading notifications...</Text>
              </View>
            ) : notificationsError ? (
              <View style={styles.modalError}> 
                <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
                <Text style={styles.modalErrorText}>{notificationsError}</Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.modalState}> 
                <Ionicons name="notifications-off-outline" size={20} color="#94a3b8" />
                <Text style={styles.modalStateText}>No notifications yet</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
                {notifications.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.notificationItem,
                      !item.isRead && styles.notificationItemUnread,
                    ]}
                    activeOpacity={0.9}
                    onPress={async () => {
                      if (!item.isRead) {
                        try {
                          await markNotificationRead(item._id);
                          setNotifications((prev) =>
                            prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
                          );
                        } catch (error) {
                          // Ignore read failures to keep UI usable.
                        }
                      }

                      if (item.concernId) {
                        const concern = trackingConcerns.find((c) => c._id === item.concernId);
                        if (concern) {
                          navigation.navigate('ConcernDetail', { concern });
                          setShowNotifications(false);
                        }
                      }
                    }}
                  >
                    <View style={styles.notificationIcon}>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#dc2626" />
                    </View>
                    <View style={styles.notificationBody}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      <Text style={styles.notificationMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                      <Text style={styles.notificationDate}>
                        {formatConcernDate(item.createdAt)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {notifications.length > 0 && (
              <TouchableOpacity
                style={styles.modalAction}
                onPress={async () => {
                  try {
                    await markAllNotificationsRead();
                    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                  } catch (error) {
                    // Ignore errors to keep UI usable.
                  }
                }}
              >
                <Text style={styles.modalActionText}>Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f2f6',
  },
  loaderText: {
    marginTop: 10,
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f6',
  },
  scrollWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 22,
    gap: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  topNavTitle: {
    color: '#111827',
    fontSize: 21,
    fontWeight: '900',
  },
  topNavActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fbcaca',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: '#dc2626',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#e53935',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    gap: 12,
  },
  heroLeft: {
    flex: 1,
  },
  heroTagWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginBottom: 10,
  },
  heroTagDot: {
    width: 7,
    height: 7,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  heroTag: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heroName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroSubText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  heroMetaRow: {
    gap: 7,
  },
  heroMetaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  heroMetaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  clockCard: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    minWidth: 110,
  },
  clockDate: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '600',
  },
  clockTime: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: '#ffffff',
  },
  avatarFallback: {
    width: 66,
    height: 66,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusCard: {
    flex: 1,
    minWidth: 102,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    backgroundColor: '#ffffff',
    padding: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'flex-start',
    minHeight: 118,
  },
  statusValue: {
    fontSize: 20,
    color: '#111827',
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  panelCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e3e9f3',
    backgroundColor: '#ffffff',
    padding: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  panelHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  panelSubtitle: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bbe5c1',
    backgroundColor: '#ecfdf3',
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  approvedDot: {
    width: 7,
    height: 7,
    borderRadius: 8,
    backgroundColor: '#2e7d32',
  },
  approvedText: {
    color: '#2e7d32',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  profileList: {
    gap: 9,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#edf1f7',
    backgroundColor: '#fbfcfe',
    padding: 10,
  },
  profileTextWrap: {
    flex: 1,
  },
  profileLabel: {
    color: '#94a3b8',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
    fontWeight: '700',
  },
  profileValue: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
  mobileActionPanel: {
    marginTop: 0,
  },
  mobileActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileActionBtn: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7e4f6',
    backgroundColor: '#f0f7ff',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  mobileActionBtnPassive: {
    backgroundColor: '#f8fafc',
    borderColor: '#e5e7eb',
  },
  mobileActionBtnDanger: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  mobileActionText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '800',
  },
  mobileActionTextDanger: {
    color: '#b71c1c',
  },
  trackingPanel: {
    gap: 9,
  },
  trackingLoader: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackingLoaderText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  trackingErrorCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingErrorText: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  trackingList: {
    gap: 10,
  },
  trackingCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  trackingTitleWrap: {
    flex: 1,
  },
  trackingType: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 3,
  },
  trackingGenre: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  trackingStatusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  trackingStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trackingStepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  trackingStepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackingStepDotActive: {
    backgroundColor: '#16a34a',
  },
  trackingStepDotIdle: {
    backgroundColor: '#cbd5f5',
  },
  trackingStepLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  trackingStepLabelActive: {
    color: '#166534',
  },
  trackingStepLabelIdle: {
    color: '#94a3b8',
  },
  trackingDescription: {
    fontSize: 12,
    color: '#4b5563',
    lineHeight: 18,
  },
  trackingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trackingDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trackingDateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
  },
  trackingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trackingLinkText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  modalState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 24,
  },
  modalStateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modalError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 10,
  },
  modalErrorText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c',
  },
  modalList: {
    marginBottom: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f8fafc',
    marginBottom: 8,
  },
  notificationItemUnread: {
    borderColor: '#fbcaca',
    backgroundColor: '#fff1f2',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBody: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  notificationDate: {
    marginTop: 4,
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
  },
  modalAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fbcaca',
    backgroundColor: '#fff5f5',
  },
  modalActionText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyStateCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fbfcfe',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    marginTop: 10,
    marginBottom: 6,
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyStateText: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  mobileBottomBar: {
    marginBottom: 2,
  },
  bottomTabsWrap: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bottomTab: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 5,
  },
  bottomTabActive: {
    backgroundColor: '#fff0f0',
  },
  bottomTabText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bottomTabTextActive: {
    color: '#e53935',
  },
});
