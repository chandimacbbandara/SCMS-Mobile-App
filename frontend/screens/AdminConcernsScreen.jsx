import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

const GENRES = [
  'All Categories',
  'Academic Support and Resources',
  'Mental Health Support',
  'Financial Aid Issues',
  'Campus Facilities',
  'Extracurricular Activities',
  'Transportation',
  'Accommodation',
  'Food Services',
  'Other'
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

function getPriorityColor(priority) {
  switch (priority) {
    case 'HIGH':
      return '#ef4444';
    case 'MEDIUM':
      return '#f59e0b';
    case 'LOW':
      return '#10b981';
    default:
      return '#64748b';
  }
}

export default function AdminConcernsScreen({ navigation }) {
  const { token } = useAuth();

  const [selectedGenre, setSelectedGenre] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [concerns, setConcerns] = useState([]);
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const fetchConcerns = useCallback(async (isRefresh) => {
    if (!token) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const queryParts = ['concernType=Normal%20Concern'];
      if (selectedStatus !== 'all') {
        queryParts.push(`status=${encodeURIComponent(selectedStatus)}`);
      }

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await apiRequest(`/concerns/all${queryString}`, {
        method: 'GET',
        token,
      });

      let allConcerns = Array.isArray(response.data) ? response.data : [];
      
      // Filter by genre if not "All Categories"
      if (selectedGenre !== 'All Categories') {
        allConcerns = allConcerns.filter(concern => concern.genre === selectedGenre);
      }

      setConcerns(allConcerns);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load concerns');
      console.error('Fetch concerns error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, selectedGenre, selectedStatus]);

  useEffect(() => {
    fetchConcerns(false);
  }, [fetchConcerns]);

  const filteredConcerns = useMemo(() => {
    return concerns;
  }, [concerns]);

  const stats = useMemo(() => {
    return {
      total: concerns.length,
      pending: concerns.filter(c => c.status === 'pending').length,
      reviewing: concerns.filter(c => c.status === 'reviewing').length,
      resolved: concerns.filter(c => c.status === 'resolved').length,
      rejected: concerns.filter(c => c.status === 'rejected').length,
    };
  }, [concerns]);

  const renderConcernCard = ({ item }) => {
    const student = item.studentId;
    const studentName = `${student?.firstName || ''} ${student?.lastName || ''}`.trim() || 'Unknown';
    const studentInitial = studentName.charAt(0).toUpperCase();
    
    return (
      <TouchableOpacity
        style={styles.concernCard}
        onPress={() => navigation.navigate('AdminConcernDetail', { concern: item })}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <View style={styles.studentInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{studentInitial}</Text>
              </View>
              <View style={styles.studentMeta}>
                <Text style={styles.studentName}>{studentName}</Text>
                <Text style={styles.studentId}>{student?.studentId || 'ID: Unknown'}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20', borderColor: getStatusColor(item.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status).toUpperCase()}</Text>
            </View>
          </View>

          <Text style={styles.genre}>{item.genre}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

          <View style={styles.footerRow}>
            <View style={styles.dateInfo}>
              <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
            {item.adminReply && (
              <View style={styles.replyBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.replyText}>Replied</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>Student Concerns</Text>
        <Text style={styles.headerSub}>Manage and respond to student concerns</Text>
      </View>

      {/* Stats Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
      >
        <View style={styles.statPill}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statPill, { borderLeftColor: '#f59e0b' }]}>
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statPill, { borderLeftColor: '#3b82f6' }]}>
          <Text style={styles.statValue}>{stats.reviewing}</Text>
          <Text style={styles.statLabel}>Reviewing</Text>
        </View>
        <View style={[styles.statPill, { borderLeftColor: '#10b981' }]}>
          <Text style={styles.statValue}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </ScrollView>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowGenreModal(true)}
        >
          <Ionicons name="funnel-outline" size={16} color="#ffffff" />
          <Text style={styles.filterBtnText}>Category</Text>
          <Ionicons name="chevron-down" size={14} color="#ffffff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowStatusModal(true)}
        >
          <Ionicons name="swap-horizontal-outline" size={16} color="#ffffff" />
          <Text style={styles.filterBtnText}>Status</Text>
          <Ionicons name="chevron-down" size={14} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.loaderText}>Loading concerns...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchConcerns(true)} tintColor="#dc2626" />}
          style={styles.contentScroll}
          showsVerticalScrollIndicator={false}
        >
          {!!errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {filteredConcerns.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="inbox-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No concerns found</Text>
              <Text style={styles.emptySub}>Try changing filters or check back later</Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {filteredConcerns.map((concern, index) => (
                <TouchableOpacity
                  key={concern._id || index}
                  style={styles.concernCard}
                  onPress={() => navigation.navigate('AdminConcernDetail', { concern })}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View style={styles.headerRow}>
                      <View style={styles.studentInfo}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>
                            {`${concern.studentId?.firstName || '?'} ${concern.studentId?.lastName || ''}`.trim().charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.studentMeta}>
                          <Text style={styles.studentName}>
                            {`${concern.studentId?.firstName || ''} ${concern.studentId?.lastName || ''}`.trim() || 'Unknown'}
                          </Text>
                          <Text style={styles.studentId}>{concern.studentId?.studentId || 'ID: Unknown'}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) + '20', borderColor: getStatusColor(concern.status) }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(concern.status) }]}>
                          {getStatusLabel(concern.status).toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.genre}>{concern.genre}</Text>
                    <Text style={styles.description} numberOfLines={2}>{concern.description}</Text>

                    <View style={styles.footerRow}>
                      <View style={styles.dateInfo}>
                        <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                        <Text style={styles.dateText}>{formatDate(concern.createdAt)}</Text>
                      </View>
                      {concern.adminReply && (
                        <View style={styles.replyBadge}>
                          <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                          <Text style={styles.replyText}>Replied</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* Genre Modal */}
      <Modal
        visible={showGenreModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowGenreModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {GENRES.map((genre) => (
                <TouchableOpacity
                  key={genre}
                  style={[styles.modalItem, selectedGenre === genre && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedGenre(genre);
                    setShowGenreModal(false);
                  }}
                >
                  {selectedGenre === genre && (
                    <Ionicons name="checkmark" size={20} color="#dc2626" style={{ marginRight: 8 }} />
                  )}
                  <Text style={[styles.modalItemText, selectedGenre === genre && styles.modalItemTextActive]}>
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter by Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {STATUS_OPTIONS.map((status) => (
                <TouchableOpacity
                  key={status.id}
                  style={[styles.modalItem, selectedStatus === status.id && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedStatus(status.id);
                    setShowStatusModal(false);
                  }}
                >
                  {selectedStatus === status.id && (
                    <Ionicons name="checkmark" size={20} color="#dc2626" style={{ marginRight: 8 }} />
                  )}
                  <Text style={[styles.modalItemText, selectedStatus === status.id && styles.modalItemTextActive]}>
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
    backgroundColor: '#f8fafc',
  },
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dc2626',
    justifyContent: 'center',
    alignItems: 'center',
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
    flex: 1,
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
