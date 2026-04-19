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

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTimeNow(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function AdminDashboardScreen() {
  const { token, user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [now, setNow] = useState(new Date());

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
      const response = await apiRequest('/auth/admin/dashboard', {
        method: 'GET',
        token,
      });
      setDashboard(response.dashboard || null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboard(false);
  }, [loadDashboard]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const metricCards = useMemo(() => {
    const totalStudents = Number(dashboard?.totalStudents || 0);
    const studentsWithPhoto = Number(dashboard?.studentsWithPhoto || 0);
    const studentsWithoutPhoto = Number(dashboard?.studentsWithoutPhoto || 0);
    const newStudentsThisMonth = Number(dashboard?.newStudentsThisMonth || 0);

    return [
      {
        id: 's1',
        label: 'Total Students',
        value: String(totalStudents),
        icon: 'layers-outline',
        colors: ['#dc2626', '#991b1b'],
      },
      {
        id: 's2',
        label: 'With ID Photo',
        value: String(studentsWithPhoto),
        icon: 'image-outline',
        colors: ['#2563eb', '#1d4ed8'],
      },
      {
        id: 's3',
        label: 'Without ID Photo',
        value: String(studentsWithoutPhoto),
        icon: 'alert-circle-outline',
        colors: ['#f59e0b', '#d97706'],
      },
      {
        id: 's4',
        label: 'New This Month',
        value: String(newStudentsThisMonth),
        icon: 'checkmark-circle-outline',
        colors: ['#16a34a', '#15803d'],
      },
    ];
  }, [dashboard?.newStudentsThisMonth, dashboard?.studentsWithPhoto, dashboard?.studentsWithoutPhoto, dashboard?.totalStudents]);

  const recentStudents = Array.isArray(dashboard?.recentStudents) ? dashboard.recentStudents : [];
  const adminName = user?.username || user?.email || 'Admin';
  const totalAdmins = Number(dashboard?.totalAdmins || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDashboard(true)} tintColor="#dc2626" />}
      >
        <LinearGradient
          colors={['#111827', '#1f2937', '#7f1d1d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.topRow}>
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>Admin Panel</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
              <Ionicons name="log-out-outline" size={16} color="#ffffff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.heroTitle}>Admin Dashboard</Text>
          <Text style={styles.heroSub}>Monitor and manage student account operations from one mobile command center.</Text>

          <View style={styles.clockCard}>
            <Text style={styles.clockDate}>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            <Text style={styles.clockTime}>{formatTimeNow(now)}</Text>
          </View>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="person-outline" size={12} color="#ffffff" />
              <Text style={styles.heroMetaText}>{adminName}</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="shield-checkmark-outline" size={12} color="#ffffff" />
              <Text style={styles.heroMetaText}>Admins: {totalAdmins}</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loaderText}>Loading admin analytics...</Text>
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

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Latest Student Registrations</Text>
                <Text style={styles.cardSub}>Live student records from database</Text>
              </View>

              {recentStudents.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="inbox-outline" size={24} color="#94a3b8" />
                  <Text style={styles.emptyText}>No student records available.</Text>
                </View>
              ) : (
                <View style={styles.listWrap}>
                  {recentStudents.map((student, index) => (
                    <View key={student.id || `${student.email}-${index}`} style={styles.rowItem}>
                      <View style={[styles.avatar, styles[`avatar${(index % 5) + 1}`]]}>
                        <Text style={styles.avatarText}>{String(student.firstName || '?').slice(0, 1).toUpperCase()}</Text>
                      </View>
                      <View style={styles.rowMeta}>
                        <Text style={styles.rowName}>{`${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Unknown Student'}</Text>
                        <Text style={styles.rowSub}>{student.email || 'No email'}</Text>
                        <Text style={styles.rowSub}>{student.studentId || 'No student ID'} • {formatDate(student.createdAt)}</Text>
                      </View>
                    </View>
                  ))}
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
    backgroundColor: '#eef1f7',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
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
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.45)',
    backgroundColor: 'rgba(220,38,38,0.18)',
    paddingVertical: 5,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#fca5a5',
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
    backgroundColor: '#dc2626',
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfe5ef',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f5',
    backgroundColor: '#f8fafc',
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  cardSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 7,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  listWrap: {
    padding: 12,
    gap: 9,
  },
  rowItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4eaf4',
    backgroundColor: '#fbfcff',
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 37,
    height: 37,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  avatar1: {
    backgroundColor: '#fecaca',
  },
  avatar2: {
    backgroundColor: '#bfdbfe',
  },
  avatar3: {
    backgroundColor: '#bbf7d0',
  },
  avatar4: {
    backgroundColor: '#fed7aa',
  },
  avatar5: {
    backgroundColor: '#bae6fd',
  },
  avatarText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  rowMeta: {
    flex: 1,
  },
  rowName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 1,
  },
  rowSub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
});
