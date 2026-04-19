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

export default function OwnerDashboardScreen() {
  const { token, user, logout } = useAuth();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchOwnerDashboard = useCallback(async (isRefresh) => {
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
      const response = await apiRequest('/auth/owner/dashboard', {
        method: 'GET',
        token,
      });
      setDashboard(response.dashboard || null);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load owner dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOwnerDashboard(false);
  }, [fetchOwnerDashboard]);

  const metricCards = useMemo(() => {
    const totalStudents = Number(dashboard?.totalStudents || 0);
    const studentsWithPhoto = Number(dashboard?.studentsWithPhoto || 0);
    const studentsWithoutPhoto = Number(dashboard?.studentsWithoutPhoto || 0);
    const newStudentsThisMonth = Number(dashboard?.newStudentsThisMonth || 0);

    return [
      {
        id: 'm1',
        label: 'Total students',
        value: String(totalStudents),
        icon: 'people-outline',
        iconColor: '#b4233a',
        iconBg: '#ffe8ec',
      },
      {
        id: 'm2',
        label: 'With ID photo',
        value: String(studentsWithPhoto),
        icon: 'image-outline',
        iconColor: '#0f6ea8',
        iconBg: '#e8f6ff',
      },
      {
        id: 'm3',
        label: 'Without ID photo',
        value: String(studentsWithoutPhoto),
        icon: 'alert-circle-outline',
        iconColor: '#c2410c',
        iconBg: '#fff4e8',
      },
      {
        id: 'm4',
        label: 'New this month',
        value: String(newStudentsThisMonth),
        icon: 'calendar-outline',
        iconColor: '#15803d',
        iconBg: '#e9f9ef',
      },
    ];
  }, [dashboard?.newStudentsThisMonth, dashboard?.studentsWithPhoto, dashboard?.studentsWithoutPhoto, dashboard?.totalStudents]);

  const latestStudent = dashboard?.latestStudent || null;
  const ownerName = `${user?.firstName || 'Owner'}${user?.lastName ? ` ${user.lastName}` : ''}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOwnerDashboard(true)} tintColor="#c53030" />}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topTitle}>Owner Dashboard</Text>
            <Text style={styles.topSub}>Academy of Knowledge Bridge</Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
            <Ionicons name="log-out-outline" size={16} color="#ffffff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={['#0f172a', '#1b2c42', '#7f1d1d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#ffd1d8" />
            <Text style={styles.heroBadgeText}>Owner access</Text>
          </View>

          <Text style={styles.heroTitle}>Welcome, {ownerName}</Text>
          <Text style={styles.heroSub}>
            This mobile owner dashboard displays live account statistics from your current backend data.
          </Text>

          <View style={styles.heroMetaWrap}>
            <View style={styles.heroMetaPill}>
              <Ionicons name="mail-outline" size={12} color="#ffffff" />
              <Text style={styles.heroMetaText}>{user?.email || 'admin@akbinstitute.edu.lk'}</Text>
            </View>
            <View style={styles.heroMetaPill}>
              <Ionicons name="refresh-outline" size={12} color="#ffffff" />
              <Text style={styles.heroMetaText}>Pull down to refresh live data</Text>
            </View>
          </View>
        </LinearGradient>

        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#c53030" />
            <Text style={styles.loaderText}>Loading owner analytics...</Text>
          </View>
        ) : (
          <>
            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.metricsGrid}>
              {metricCards.map((item) => (
                <View key={item.id} style={styles.metricCard}>
                  <View style={[styles.metricIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={19} color={item.iconColor} />
                  </View>
                  <Text style={styles.metricValue}>{item.value}</Text>
                  <Text style={styles.metricLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Latest Registered Student</Text>
              </View>

              {latestStudent ? (
                <View style={styles.detailsWrap}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Name</Text>
                    <Text style={styles.detailValue}>
                      {`${latestStudent.firstName || ''} ${latestStudent.lastName || ''}`.trim() || 'Not available'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue}>{latestStudent.email || 'Not available'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student ID</Text>
                    <Text style={styles.detailValue}>{latestStudent.studentId || 'Not available'}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Registered on</Text>
                    <Text style={styles.detailValue}>{formatDate(latestStudent.createdAt)}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <Ionicons name="person-outline" size={26} color="#94a3b8" />
                  <Text style={styles.emptyText}>No student records found yet.</Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Operations Notes</Text>
              </View>

              <View style={styles.noteRow}>
                <Ionicons name="information-circle-outline" size={16} color="#0f6ea8" />
                <Text style={styles.noteText}>Metrics on this screen are live values from your Student database.</Text>
              </View>
              <View style={styles.noteRow}>
                <Ionicons name="bar-chart-outline" size={16} color="#0f6ea8" />
                <Text style={styles.noteText}>No sample or demo data is rendered on this owner dashboard.</Text>
              </View>
              <View style={styles.noteRow}>
                <Ionicons name="construct-outline" size={16} color="#0f6ea8" />
                <Text style={styles.noteText}>Concern analytics can be added later when concern APIs are available.</Text>
              </View>
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
    backgroundColor: '#eef2f7',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topTitle: {
    color: '#0f172a',
    fontSize: 21,
    fontWeight: '900',
  },
  topSub: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  logoutBtn: {
    borderRadius: 999,
    backgroundColor: '#c53030',
    paddingHorizontal: 12,
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
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroBadgeText: {
    marginLeft: 5,
    color: '#ffd1d8',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 7,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  heroMetaWrap: {
    gap: 7,
  },
  heroMetaPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroMetaText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  loaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5ef',
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
    backgroundColor: '#fff1f2',
    paddingHorizontal: 11,
    paddingVertical: 9,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 10,
  },
  metricCard: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    padding: 12,
    minHeight: 116,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  metricIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    color: '#122033',
    fontSize: 23,
    fontWeight: '900',
    marginBottom: 3,
  },
  metricLabel: {
    color: '#5b6b7f',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef6',
    backgroundColor: '#fbfdff',
  },
  cardTitle: {
    color: '#122033',
    fontSize: 14,
    fontWeight: '800',
  },
  detailsWrap: {
    padding: 13,
    gap: 8,
  },
  detailRow: {
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#e5ecf4',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: '#122033',
    fontSize: 12,
    fontWeight: '800',
    flexShrink: 1,
    textAlign: 'right',
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  noteRow: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: '#eef2f7',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    marginLeft: 8,
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    flex: 1,
  },
});
