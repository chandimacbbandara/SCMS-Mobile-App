import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not available';
  }

  return parsed.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCareLevel(rating) {
  const value = Number(rating || 0);
  if (value <= 2) {
    return { label: 'High Priority', color: '#b91c1c', bg: '#fee2e2' };
  }

  if (value <= 3) {
    return { label: 'Monitor', color: '#b45309', bg: '#fef3c7' };
  }

  return { label: 'Stable', color: '#166534', bg: '#dcfce7' };
}

export default function ConsulterDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadDashboard = useCallback(async (isRefresh) => {
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
      const result = await apiRequest('/auth/consulter/dashboard', {
        method: 'GET',
        token,
      });
      setDashboard(result.dashboard || null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load consulter dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  const cards = useMemo(() => {
    const totalStudents = Number(dashboard?.totalStudents || 0);
    const totalFeedback = Number(dashboard?.totalFeedback || 0);
    const criticalFeedback = Number(dashboard?.criticalFeedback || 0);
    const weeklyFeedback = Number(dashboard?.weeklyFeedback || 0);

    return [
      {
        id: 'c1',
        label: 'Students in System',
        value: String(totalStudents),
        icon: 'people-outline',
      },
      {
        id: 'c2',
        label: 'Total Feedback Cases',
        value: String(totalFeedback),
        icon: 'chatbox-ellipses-outline',
      },
      {
        id: 'c3',
        label: 'High Priority Cases',
        value: String(criticalFeedback),
        icon: 'warning-outline',
      },
      {
        id: 'c4',
        label: 'Cases This Week',
        value: String(weeklyFeedback),
        icon: 'calendar-outline',
      },
    ];
  }, [dashboard?.criticalFeedback, dashboard?.totalFeedback, dashboard?.totalStudents, dashboard?.weeklyFeedback]);

  const recentFeedback = Array.isArray(dashboard?.recentFeedback) ? dashboard.recentFeedback : [];
  const consulterName = user?.username || user?.email || 'Consulter';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor="#0f766e" />}
      >
        <LinearGradient
          colors={['#0f172a', '#134e4a', '#0f766e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <Ionicons name="medkit-outline" size={12} color="#ccfbf1" />
              <Text style={styles.badgeText}>Consulter Care Desk</Text>
            </View>

            <View style={styles.topActions}>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
                <Ionicons name="log-out-outline" size={16} color="#ffffff" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.heroTitle}>Student Wellness Dashboard</Text>
          <Text style={styles.heroSub}>Track feedback trends, review priority concerns, and support students with timely care follow-up.</Text>

          <View style={styles.heroMetaWrap}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="person-outline" size={12} color="#ffffff" />
              <Text style={styles.heroMetaText}>{consulterName}</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#0f766e" />
            <Text style={styles.loaderText}>Loading care dashboard...</Text>
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
              {cards.map((card) => (
                <View key={card.id} style={styles.statCard}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name={card.icon} size={17} color="#0f766e" />
                  </View>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statLabel}>{card.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Recent Student Feedback</Text>
                <Text style={styles.cardSub}>Prioritize low ratings for early intervention.</Text>
              </View>

              {recentFeedback.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="document-text-outline" size={24} color="#94a3b8" />
                  <Text style={styles.emptyText}>No feedback records found yet.</Text>
                </View>
              ) : (
                <View style={styles.listWrap}>
                  {recentFeedback.map((item, index) => {
                    const level = getCareLevel(item.rating);

                    return (
                      <View key={item.id || `${item.studentEmail}-${index}`} style={styles.listItem}>
                        <View style={styles.listTopRow}>
                          <View style={styles.identityWrap}>
                            <Text style={styles.studentName}>{item.studentName || 'Student'}</Text>
                            <Text style={styles.studentSub}>{item.studentId || 'No ID'} • {formatDate(item.createdAt)}</Text>
                          </View>

                          <View style={[styles.priorityPill, { backgroundColor: level.bg }]}> 
                            <Text style={[styles.priorityText, { color: level.color }]}>{level.label}</Text>
                          </View>
                        </View>

                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={13} color="#d97706" />
                          <Text style={styles.ratingText}>Rating: {Number(item.rating || 0)} / 5</Text>
                        </View>

                        <Text style={styles.commentText} numberOfLines={3}>{item.comment || 'No comment'}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  hero: {
    borderRadius: 22,
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
    borderColor: 'rgba(204,251,241,0.36)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    marginLeft: 5,
    color: '#ccfbf1',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  logoutBtn: {
    borderRadius: 999,
    backgroundColor: '#0f766e',
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackBtn: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.33)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackText: {
    marginLeft: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  logoutText: {
    marginLeft: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 5,
  },
  heroSub: {
    color: 'rgba(236,254,255,0.9)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  heroMetaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  heroMetaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
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
    borderColor: '#dce6f1',
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
    borderColor: '#dce6f1',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  statIconWrap: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: '#e6fffb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 3,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce6f1',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef6',
    backgroundColor: '#fbfdff',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '900',
  },
  cardSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  listWrap: {
    padding: 12,
    gap: 9,
  },
  listItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce6f1',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  listTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 7,
  },
  identityWrap: {
    flex: 1,
  },
  studentName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
  studentSub: {
    marginTop: 1,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 5,
    color: '#7c2d12',
    fontSize: 11,
    fontWeight: '700',
  },
  commentText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
});
