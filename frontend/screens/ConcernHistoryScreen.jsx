import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { getStudentConcerns, deleteStudentConcern } from '../lib/api';

const ConcernHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [concerns, setConcerns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConcerns = useCallback(async (isRefresh = false) => {
    const studentId = user?.id || user?._id;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    if (!studentId) {
      setConcerns([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await getStudentConcerns(studentId);
      setConcerns(response.data || []);
    } catch (error) {
      console.error('Error loading concerns:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, user?._id]);
  
  const handleDelete = async (concernId) => {
    Alert.alert(
      'Delete Concern',
      'Are you sure you want to delete this concern?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deleteStudentConcern(concernId);
              if (response.success) {
                Alert.alert('Success', 'Concern deleted successfully');
                loadConcerns(true);
              } else {
                Alert.alert('Error', response.message || 'Failed to delete concern');
              }
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete concern');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    loadConcerns(false);
  }, [loadConcerns]);

  useFocusEffect(
    useCallback(() => {
      loadConcerns(true);
    }, [loadConcerns])
  );

  const getStatusConfig = (status) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'pending':
        return { color: '#f59e0b', bg: '#fef3c7', icon: 'time-outline', label: 'Pending' };
      case 'reviewing':
        return { color: '#3b82f6', bg: '#dbeafe', icon: 'eye-outline', label: 'Reviewing' };
      case 'resolved':
        return { color: '#16a34a', bg: '#dcfce7', icon: 'checkmark-circle-outline', label: 'Completed' };
      case 'rejected':
        return { color: '#dc2626', bg: '#fee2e2', icon: 'close-circle-outline', label: 'Rejected' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', icon: 'help-circle-outline', label: 'Unknown' };
    }
  };

  const renderConcernCard = ({ item }) => {
    const config = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ConcernDetail', { concern: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardHeader}>
            <View style={styles.typeBadge}>
              <Text style={styles.concernType}>{item.concernType || 'Normal Concern'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Ionicons name={config.icon} size={12} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          <Text style={styles.genre}>{item.genre}</Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {item.adminReply ? (
          <View style={styles.replyBox}>
            <View style={styles.replyIcon}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#16a34a" />
            </View>
            <Text style={styles.replyText} numberOfLines={2}>
              {item.adminReply}
            </Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.footerInfo}>
            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
            <Text style={styles.date}>
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.footerActions}>
            {item.status === 'pending' && (
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.editBtn} 
                  onPress={() => navigation.navigate('SubmitConcern', { concern: item })}
                >
                  <Ionicons name="pencil" size={12} color="#3b82f6" />
                  <Text style={styles.editBtnText}>Update</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteBtn} 
                  onPress={() => handleDelete(item._id || item.id)}
                >
                  <Ionicons name="trash-outline" size={12} color="#dc2626" />
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.viewDetail}
              onPress={() => navigation.navigate('ConcernDetail', { concern: item })}
            >
              <Text style={styles.detailText}>View Details</Text>
              <Ionicons name="arrow-forward" size={14} color="#e53935" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Concern History</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={['#e53935', '#b71c1c']}
          style={styles.summaryBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{concerns.length}</Text>
            <Text style={styles.summaryLabel}>Total Submissions</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {concerns.filter(c => c.status === 'resolved').length}
            </Text>
            <Text style={styles.summaryLabel}>Resolved</Text>
          </View>
        </LinearGradient>

        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e53935" />
            <Text style={styles.loadingText}>Loading your concerns...</Text>
          </View>
        ) : (
          <FlatList
            data={concerns}
            keyExtractor={(item) => item._id || item.id}
            renderItem={renderConcernCard}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadConcerns(true)} tintColor="#e53935" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.emptyTitle}>No Concerns Found</Text>
                <Text style={styles.emptyText}>You haven't submitted any concerns yet. When you do, they'll appear here.</Text>
                <TouchableOpacity
                  style={styles.emptySubmitBtn}
                  onPress={() => navigation.navigate('SubmitConcern')}
                >
                  <LinearGradient
                    colors={['#e53935', '#b71c1c']}
                    style={styles.emptySubmitGradient}
                  >
                    <Text style={styles.emptySubmitText}>Submit New Concern</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SubmitConcern')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#e53935', '#b71c1c']}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e53935',
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
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  summaryBanner: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTop: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  concernType: {
    fontSize: 10,
    fontWeight: '800',
    color: '#e53935',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  genre: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
  },
  description: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 14,
  },
  replyBox: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  replyIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  replyText: {
    flex: 1,
    fontSize: 12,
    color: '#166534',
    fontWeight: '500',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  viewDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginRight: 4,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  editBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#3b82f6',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  deleteBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
    marginBottom: 30,
  },
  emptySubmitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  emptySubmitGradient: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  emptySubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConcernHistoryScreen;