import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

export default function StudentDashboardScreen({ navigation }) {
  const { user, logout, apiBaseUrl, refreshMe } = useAuth();
  const [clock, setClock] = useState(getNowParts());
  const [refreshing, setRefreshing] = useState(false);
  const [initialSyncing, setInitialSyncing] = useState(false);

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

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMe();
    } catch (error) {
      // No-op: existing data remains visible.
    } finally {
      setRefreshing(false);
    }
  }, [refreshMe]);

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
            <Text style={styles.panelSubtitle}>No sample items</Text>
          </View>

          <View style={styles.emptyStateCard}>
            <Ionicons name="file-tray-outline" size={28} color="#9aa4b2" />
            <Text style={styles.emptyStateTitle}>No concerns available yet</Text>
            <Text style={styles.emptyStateText}>
              This dashboard now shows real data only. Concern records will appear when the concern backend API is connected.
            </Text>
          </View>
        </View>
      </ScrollView>
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
