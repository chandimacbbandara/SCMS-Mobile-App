import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

const GENRES = [
  'All Categories',
  'Medical Concern',
];

const STATUS_OPTIONS = [
  { id: 'all', label: 'All Status', color: '#64748b' },
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

function formatTimeNow(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function getStatusColor(status) {
  const statusObj = STATUS_OPTIONS.find((s) => s.id === status);
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

export default function ConsulterDashboardScreen({ navigation }) {
  const { token, user, logout, apiBaseUrl } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(new Date());
  const [selectedGenre, setSelectedGenre] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [concernsLoading, setConcernsLoading] = useState(true);
  const [concernsErrorMessage, setConcernsErrorMessage] = useState('');
  const [concerns, setConcerns] = useState([]);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [markReadLoadingId, setMarkReadLoadingId] = useState(null);

  const loadDashboard = useCallback(async (isRefresh) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (!isRefresh) {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const result = await apiRequest('/auth/consulter/dashboard', {
        method: 'GET',
        token,
      });
      setDashboard(result.dashboard || null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load consulter dashboard');
    } finally {
      if (!isRefresh) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const fetchConcerns = useCallback(
      async (isRefresh) => {
        if (!token) {
          setConcernsLoading(false);
          return;
        }

        if (!isRefresh) {
          setConcernsLoading(true);
        }

        setConcernsErrorMessage('');

        try {
          const queryParts = ['concernType=Consulting%20Support'];
          if (selectedStatus !== 'all') {
            queryParts.push(`status=${encodeURIComponent(selectedStatus)}`);
          }

          const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
          const response = await apiRequest(`/concerns/all${queryString}`, {
            method: 'GET',
            token,
          });

          let allConcerns = Array.isArray(response.data) ? response.data : [];
          if (selectedGenre !== 'All Categories') {
            allConcerns = allConcerns.filter((c) => c.genre === selectedGenre);
          }

          setConcerns(allConcerns);
        } catch (error) {
          setConcernsErrorMessage(error.message || 'Failed to load medical concerns');
        } finally {
          setConcernsLoading(false);
        }
      },
      [selectedGenre, selectedStatus, token]
  );

  useEffect(() => {
    fetchConcerns(false);
  }, [fetchConcerns]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const metricCards = useMemo(() => {
    const totalStudents = Number(dashboard?.totalStudents || 0);
    const totalConsulting = Number(dashboard?.totalConsultingConcerns || 0);
    const pendingConsulting = Number(dashboard?.pendingConsultingConcerns || 0);
    const weeklyFeedback = Number(dashboard?.weeklyFeedback || 0);

    return [
      {
        id: 'c1',
        label: 'Total Students',
        value: String(totalStudents),
        icon: 'people-outline',
        colors: ['#dc2626', '#991b1b'],
      },
      {
        id: 'c2',
        label: 'Medical Concerns',
        value: String(totalConsulting),
        icon: 'medkit-outline',
        colors: ['#2563eb', '#1d4ed8'],
      },
      {
        id: 'c3',
        label: 'Pending Requests',
        value: String(pendingConsulting),
        icon: 'time-outline',
        colors: ['#f59e0b', '#d97706'],
      },
      {
        id: 'c4',
        label: 'Cases This Week',
        value: String(weeklyFeedback),
        icon: 'calendar-outline',
        colors: ['#16a34a', '#15803d'],
      },
    ];
  }, [
    dashboard?.pendingConsultingConcerns,
    dashboard?.totalConsultingConcerns,
    dashboard?.totalStudents,
    dashboard?.weeklyFeedback,
  ]);

  const consulterName = user?.username || user?.email || 'Consulter';
  const totalConsultingConcerns = Number(dashboard?.totalConsultingConcerns || 0);

  const handleMarkAsRead = useCallback(
      async (concernId) => {
        if (!token) return;

        setMarkReadLoadingId(concernId);
        try {
          const response = await apiRequest(`/concerns/status/${concernId}`, {
            method: 'PUT',
            token,
            body: { status: 'reviewing' },
          });

          if (response?.success) {
            setConcerns((prev) => prev.map((c) => (c._id === concernId ? { ...c, status: 'reviewing' } : c)));
          }
          Alert.alert('Success', 'Marked as read');
        } catch (error) {
          Alert.alert('Error', error.message || 'Failed to mark as read');
        } finally {
          setMarkReadLoadingId(null);
        }
      },
      [token]
  );

  const stats = useMemo(() => {
    return {
      total: concerns.length,
      pending: concerns.filter((c) => c.status === 'pending').length,
      reviewing: concerns.filter((c) => c.status === 'reviewing').length,
      resolved: concerns.filter((c) => c.status === 'resolved').length,
      rejected: concerns.filter((c) => c.status === 'rejected').length,
    };
  }, [concerns]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadDashboard(true), fetchConcerns(true)]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchConcerns, loadDashboard]);

  return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
            contentContainerStyle={styles.scrollWrap}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#dc2626" />}
        >
          <LinearGradient
              colors={['#0f172a', '#134e4a', '#0d9488']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
          >
            <View style={styles.topRow}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Consulter Panel</Text>
              </View>

              <View style={styles.topActions}>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
                  <Ionicons name="log-out-outline" size={16} color="#ffffff" />
                  <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.heroTitle}>Consulter Dashboard</Text>
            <Text style={styles.heroSub}>Monitor medical concerns and provide timely care responses from one command center.</Text>

            <View style={styles.clockCard}>
              <Text style={styles.clockDate}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
              <Text style={styles.clockTime}>{formatTimeNow(now)}</Text>
            </View>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="person-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>{consulterName}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="medkit-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>Medical Cases: {totalConsultingConcerns}</Text>
              </View>
            </View>
          </LinearGradient>

          {loading ? (
              <View style={styles.loaderCard}>
                <ActivityIndicator size="large" color="#0d9488" />
                <Text style={styles.loaderText}>Loading consulter analytics...</Text>
              </View>
          ) : (
              <>
                {!!errorMessage && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                      <Text style={styles.errorText}>{errorMessage}</Text>
                    </View>
                )}

                <View style={styles.statsGrid}>
                  {metricCards.map((card) => (
                      <View key={card.id} style={styles.statCard}>
                        <LinearGradient colors={card.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statIconWrap}>
                          <Ionicons name={card.icon} size={17} color="#ffffff" />
                        </LinearGradient>
                        <Text style={styles.statValue}>{card.value}</Text>
                        <Text style={styles.statLabel}>{card.label}</Text>
                      </View>
                  ))}
                </View>

                <View style={styles.concernsFullBleed}>
                  <View style={concernsStyles.headerSection}>
                    <Text style={concernsStyles.headerTitle}>Medical Concerns</Text>
                    <Text style={concernsStyles.headerSub}>Manage and respond to consulting support concerns</Text>
                  </View>

                  <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={concernsStyles.statsScroll}
                      contentContainerStyle={concernsStyles.statsContent}
                  >
                    <View style={concernsStyles.statPill}>
                      <Text style={concernsStyles.statValue}>{stats.total}</Text>
                      <Text style={concernsStyles.statLabel}>Total</Text>
                    </View>
                    <View style={[concernsStyles.statPill, { borderLeftColor: '#f59e0b' }]}>
                      <Text style={concernsStyles.statValue}>{stats.pending}</Text>
                      <Text style={concernsStyles.statLabel}>Pending</Text>
                    </View>
                    <View style={[concernsStyles.statPill, { borderLeftColor: '#3b82f6' }]}>
                      <Text style={concernsStyles.statValue}>{stats.reviewing}</Text>
                      <Text style={concernsStyles.statLabel}>Reviewing</Text>
                    </View>
                    <View style={[concernsStyles.statPill, { borderLeftColor: '#10b981' }]}>
                      <Text style={concernsStyles.statValue}>{stats.resolved}</Text>
                      <Text style={concernsStyles.statLabel}>Completed</Text>
                    </View>
                  </ScrollView>

                  <View style={concernsStyles.filterRow}>
                    <TouchableOpacity style={concernsStyles.filterBtn} onPress={() => setShowGenreModal(true)}>
                      <Ionicons name="funnel-outline" size={16} color="#ffffff" />
                      <Text style={concernsStyles.filterBtnText}>Category</Text>
                      <Ionicons name="chevron-down" size={14} color="#ffffff" />
                    </TouchableOpacity>

                    <TouchableOpacity style={concernsStyles.filterBtn} onPress={() => setShowStatusModal(true)}>
                      <Ionicons name="swap-horizontal-outline" size={16} color="#ffffff" />
                      <Text style={concernsStyles.filterBtnText}>Status</Text>
                      <Ionicons name="chevron-down" size={14} color="#ffffff" />
                    </TouchableOpacity>
                  </View>

                  {concernsLoading ? (
                      <View style={concernsStyles.loaderWrap}>
                        <ActivityIndicator size="large" color="#0d9488" />
                        <Text style={concernsStyles.loaderText}>Loading concerns...</Text>
                      </View>
                  ) : (
                      <View style={concernsStyles.contentWrap}>
                        {!!concernsErrorMessage && (
                            <View style={concernsStyles.errorBanner}>
                              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
                              <Text style={concernsStyles.errorText}>{concernsErrorMessage}</Text>
                            </View>
                        )}

                        {concerns.length === 0 ? (
                            <View style={concernsStyles.emptyWrap}>
                              <Ionicons name="inbox-outline" size={40} color="#cbd5e1" />
                              <Text style={concernsStyles.emptyTitle}>No concerns found</Text>
                              <Text style={concernsStyles.emptySub}>Try changing filters or check back later</Text>
                            </View>
                        ) : (
                            <View style={concernsStyles.listWrap}>
                              {concerns.map((concern, index) => (
                                  <View
                                      key={concern._id || index}
                                      style={concernsStyles.concernCard}
                                  >
                                    <TouchableOpacity
                                        style={concernsStyles.cardContent}
                                        onPress={() => navigation.navigate('ConcernDetail', { concern })}
                                        activeOpacity={0.7}
                                    >
                                      <View style={concernsStyles.headerRow}>
                                        <View style={concernsStyles.studentInfo}>
                                          <View style={concernsStyles.avatar}>
                                            {concern.studentId?.studentIdPhoto ? (
                                                <Image
                                                    source={{ uri: `${apiBaseUrl}${concern.studentId.studentIdPhoto}` }}
                                                    style={concernsStyles.avatarImage}
                                                />
                                            ) : (
                                                <Text style={concernsStyles.avatarText}>
                                                  {`${concern.studentId?.firstName || '?'} ${concern.studentId?.lastName || ''}`
                                                      .trim()
                                                      .charAt(0)
                                                      .toUpperCase()}
                                                </Text>
                                            )}
                                          </View>
                                          <View style={concernsStyles.studentMeta}>
                                            <Text style={concernsStyles.studentName}>
                                              {`${concern.studentId?.firstName || ''} ${concern.studentId?.lastName || ''}`.trim() || 'Unknown'}
                                            </Text>
                                            <Text style={concernsStyles.studentId}>{concern.studentId?.studentId || 'ID: Unknown'}</Text>
                                          </View>
                                        </View>
                                        <View
                                            style={[
                                              concernsStyles.statusBadge,
                                              {
                                                backgroundColor: getStatusColor((concern.status || 'pending').toLowerCase()) + '20',
                                                borderColor: getStatusColor((concern.status || 'pending').toLowerCase()),
                                              },
                                            ]}
                                        >
                                          <Text
                                              style={[
                                                concernsStyles.statusText,
                                                { color: getStatusColor((concern.status || 'pending').toLowerCase()) },
                                              ]}
                                          >
                                              {getStatusLabel(String(concern.status || 'pending').toLowerCase()).toUpperCase()}
                                          </Text>
                                        </View>
                                      </View>

                                      <Text style={concernsStyles.genre}>{concern.genre}</Text>
                                      <Text style={concernsStyles.description} numberOfLines={2}>
                                        {concern.description}
                                      </Text>
                                    </TouchableOpacity>

                                    <View style={concernsStyles.footerRow}>
                                      <View style={concernsStyles.dateInfo}>
                                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                                        <Text style={concernsStyles.dateText}>{formatDate(concern.createdAt)}</Text>
                                      </View>

                                      <View style={concernsStyles.footerActions}>
                                        {String(concern.status || 'pending').toLowerCase() === 'pending' && (
                                            <TouchableOpacity
                                                style={[
                                                  concernsStyles.markReadBtn,
                                                  markReadLoadingId === concern._id && { opacity: 0.6 },
                                                ]}
                                                disabled={markReadLoadingId === concern._id}
                                                onPress={() => handleMarkAsRead(concern._id)}
                                                activeOpacity={0.8}
                                            >
                                              {markReadLoadingId === concern._id ? (
                                                  <ActivityIndicator size="small" color="#3b82f6" />
                                              ) : (
                                                  <Ionicons name="eye-outline" size={14} color="#3b82f6" />
                                              )}
                                              <Text style={concernsStyles.markReadText}>Mark as read</Text>
                                            </TouchableOpacity>
                                        )}

                                        {concern.adminReply && (
                                            <View style={concernsStyles.replyBadge}>
                                              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                              <Text style={concernsStyles.replyText}>Replied</Text>
                                            </View>
                                        )}
                                      </View>
                                    </View>
                                  </View>
                              ))}
                            </View>
                        )}
                      </View>
                  )}
                </View>
              </>
          )}
        </ScrollView>

        <Modal
            visible={showGenreModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowGenreModal(false)}
        >
          <View style={concernsStyles.modalOverlay}>
            <View style={concernsStyles.modalContent}>
              <View style={concernsStyles.modalHeader}>
                <Text style={concernsStyles.modalTitle}>Select Category</Text>
                <TouchableOpacity onPress={() => setShowGenreModal(false)}>
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <ScrollView style={concernsStyles.modalList}>
                {GENRES.map((genre) => (
                    <TouchableOpacity
                        key={genre}
                        style={[
                          concernsStyles.modalItem,
                          selectedGenre === genre && concernsStyles.modalItemActive,
                        ]}
                        onPress={() => {
                          setSelectedGenre(genre);
                          setShowGenreModal(false);
                        }}
                    >
                      {selectedGenre === genre && (
                          <Ionicons
                              name="checkmark"
                              size={20}
                              color="#dc2626"
                              style={{ marginRight: 8 }}
                          />
                      )}
                      <Text
                          style={[
                            concernsStyles.modalItemText,
                            selectedGenre === genre && concernsStyles.modalItemTextActive,
                          ]}
                      >
                        {genre}
                      </Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
            visible={showStatusModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowStatusModal(false)}
        >
          <View style={concernsStyles.modalOverlay}>
            <View style={concernsStyles.modalContent}>
              <View style={concernsStyles.modalHeader}>
                <Text style={concernsStyles.modalTitle}>Filter by Status</Text>
                <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                  <Ionicons name="close" size={24} color="#1e293b" />
                </TouchableOpacity>
              </View>
              <ScrollView style={concernsStyles.modalList}>
                {STATUS_OPTIONS.map((status) => (
                    <TouchableOpacity
                        key={status.id}
                        style={[
                          concernsStyles.modalItem,
                          selectedStatus === status.id && concernsStyles.modalItemActive,
                        ]}
                        onPress={() => {
                          setSelectedStatus(status.id);
                          setShowStatusModal(false);
                        }}
                    >
                      {selectedStatus === status.id && (
                          <Ionicons
                              name="checkmark"
                              size={20}
                              color="#dc2626"
                              style={{ marginRight: 8 }}
                          />
                      )}
                      <Text
                          style={[
                            concernsStyles.modalItemText,
                            selectedStatus === status.id && concernsStyles.modalItemTextActive,
                          ]}
                      >
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef1f7',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  concernsFullBleed: {
    marginTop: 12,
    marginHorizontal: -14,
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hero: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingHorizontal: 15,
    paddingVertical: 16,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 9,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.4)',
    backgroundColor: 'rgba(13,148,136,0.15)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#2dd4bf',
  },
  badgeText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  logoutBtn: {
    borderRadius: 999,
    backgroundColor: '#0d9488',
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
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 5,
  },
  heroSub: {
    color: 'rgba(226,232,240,0.9)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 11,
  },
  clockCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.28)',
    backgroundColor: 'rgba(15,23,42,0.5)',
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginBottom: 9,
  },
  clockDate: {
    color: 'rgba(226,232,240,0.8)',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 3,
  },
  clockTime: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  heroMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  heroMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.09)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    marginLeft: 5,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  loaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfe5ef',
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  loaderText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 6,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfe5ef',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  statIconWrap: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 3,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

const concernsStyles = StyleSheet.create({
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  statsScroll: {
    height: 80,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  statPill: {
    borderLeftWidth: 3,
    borderLeftColor: '#64748b',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 90,
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  loaderWrap: {
    paddingVertical: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  contentWrap: {
    backgroundColor: '#f8fafc',
  },
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
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
  listWrap: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    paddingBottom: 20,
  },
  concernCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  cardContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0d9488',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  studentMeta: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  genre: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: '#3b82f620',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
  },
  replyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  replyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
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
    maxHeight: '80%',
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
