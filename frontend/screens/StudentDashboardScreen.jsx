import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
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

const quickActions = [
  {
    id: 'report',
    title: 'Submit Concern',
    subtitle: 'Create a new concern ticket',
    icon: 'document-text-outline',
    iconBg: '#fdecea',
    iconColor: '#d32f2f',
  },
  {
    id: 'drafts',
    title: 'Drafts',
    subtitle: 'Continue unfinished reports',
    icon: 'folder-open-outline',
    iconBg: '#fff4e5',
    iconColor: '#f57c00',
  },
  {
    id: 'profile',
    title: 'Profile',
    subtitle: 'Update account information',
    icon: 'person-outline',
    iconBg: '#e8f1fe',
    iconColor: '#1565c0',
  },
  {
    id: 'help',
    title: 'Support',
    subtitle: 'Need help with your account?',
    icon: 'help-circle-outline',
    iconBg: '#e9f7ef',
    iconColor: '#2e7d32',
  },
];

const dashboardTips = [
  {
    id: 'tip-1',
    title: 'Attach clear evidence',
    text: 'Images and precise details help admins resolve concerns faster.',
    icon: 'camera-outline',
    iconColor: '#d32f2f',
    iconBg: '#fdecea',
  },
  {
    id: 'tip-2',
    title: 'Track status daily',
    text: 'Use your dashboard progress to monitor each concern journey.',
    icon: 'pulse-outline',
    iconColor: '#0d47a1',
    iconBg: '#e8f1fe',
  },
  {
    id: 'tip-3',
    title: 'Respond quickly',
    text: 'If admin asks for details, reply quickly to avoid delays.',
    icon: 'chatbox-ellipses-outline',
    iconColor: '#ef6c00',
    iconBg: '#fff4e5',
  },
];

const concernMock = [
  {
    id: 'CN-2026-041',
    subject: 'Exam timetable clash',
    status: 'in-progress',
    updatedAt: 'Updated 2 hours ago',
    preview: 'Two mandatory module exams are scheduled at the same time this Friday.',
  },
  {
    id: 'CN-2026-033',
    subject: 'Library access issue',
    status: 'pending',
    updatedAt: 'Updated yesterday',
    preview: 'Student portal access card is not opening the library gate after 6 PM.',
  },
  {
    id: 'CN-2026-017',
    subject: 'Lecture hall equipment',
    status: 'complete',
    updatedAt: 'Resolved 3 days ago',
    preview: 'Projector in Hall 03 was not working for multiple sessions.',
  },
];

function getInitials(firstName, lastName, email) {
  const f = String(firstName || '').trim();
  const l = String(lastName || '').trim();

  if (f || l) {
    return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase();
  }

  return String(email || 'S').trim().charAt(0).toUpperCase() || 'S';
}

function getStatusConfig(status) {
  if (status === 'complete') {
    return {
      label: 'Complete',
      bg: '#e8f5e9',
      text: '#2e7d32',
      progress: 1,
    };
  }

  if (status === 'in-progress') {
    return {
      label: 'In Progress',
      bg: '#fff3e0',
      text: '#ef6c00',
      progress: 0.66,
    };
  }

  return {
    label: 'Pending',
    bg: '#f3f4f6',
    text: '#475569',
    progress: 0.25,
  };
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

export default function StudentDashboardScreen() {
  const { user, logout, apiBaseUrl } = useAuth();
  const [clock, setClock] = useState(getNowParts());

  useEffect(() => {
    const timer = setInterval(() => {
      setClock(getNowParts());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  const statData = useMemo(() => {
    const total = concernMock.length;
    const inProgressCount = concernMock.filter((item) => item.status === 'in-progress').length;
    const completedCount = concernMock.filter((item) => item.status === 'complete').length;

    return [
      {
        id: 'st-1',
        label: 'Total Concerns',
        value: String(total),
        icon: 'layers-outline',
        color: '#d32f2f',
        bg: '#fdecea',
      },
      {
        id: 'st-2',
        label: 'In Progress',
        value: String(inProgressCount),
        icon: 'time-outline',
        color: '#ef6c00',
        bg: '#fff4e5',
      },
      {
        id: 'st-3',
        label: 'Resolved',
        value: String(completedCount),
        icon: 'checkmark-done-outline',
        color: '#2e7d32',
        bg: '#e8f5e9',
      },
    ];
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.topNavRow}>
          <Text style={styles.topNavTitle}>Student Dashboard</Text>
          <View style={styles.topNavActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
              <Ionicons name="notifications-outline" size={18} color="#374151" />
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
            <Text style={styles.heroSubText}>Manage your concerns, monitor progress, and stay informed.</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.heroMetaPill}>
                <Ionicons name="mail-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>{user?.email || 'No email'}</Text>
              </View>
              <View style={styles.heroMetaPill}>
                <Ionicons name="id-card-outline" size={12} color="#ffffff" />
                <Text style={styles.heroMetaText}>{user?.studentId || 'No ID'}</Text>
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

        <View style={styles.statsRow}>
          {statData.map((item) => (
            <View key={item.id} style={styles.statCard}>
              <View style={[styles.statIconWrap, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.workspaceGrid}>
          <View style={styles.panelCard}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Student Profile</Text>
              <View style={styles.approvedBadge}>
                <View style={styles.approvedDot} />
                <Text style={styles.approvedText}>Verified</Text>
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

          <View style={styles.panelCard}>
            <View style={styles.panelHeaderRow}>
              <Text style={styles.panelTitle}>Quick Actions</Text>
              <Text style={styles.panelSubtitle}>Fast student workflows</Text>
            </View>

            <View style={styles.actionsGrid}>
              {quickActions.map((item) => (
                <TouchableOpacity key={item.id} style={styles.actionCard} activeOpacity={0.9}>
                  <View style={[styles.actionIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <Text style={styles.actionTitle}>{item.title}</Text>
                  <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.panelCard, styles.trackingPanel]}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Concern Tracking</Text>
            <Text style={styles.panelSubtitle}>Recent activities</Text>
          </View>

          {concernMock.map((item) => {
            const status = getStatusConfig(item.status);
            return (
              <View key={item.id} style={styles.concernCard}>
                <View style={styles.concernHeader}>
                  <View style={styles.concernHeaderLeft}>
                    <Text style={styles.concernRef}>{item.id}</Text>
                    <Text style={styles.concernTitle}>{item.subject}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                  </View>
                </View>

                <Text style={styles.concernPreview}>{item.preview}</Text>

                <View style={styles.progressTrack}>
                  <View style={styles.progressRail} />
                  <View style={[styles.progressFill, { width: `${Math.round(status.progress * 100)}%` }]} />
                </View>

                <Text style={styles.concernTime}>{item.updatedAt}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.panelCard, styles.tipsPanel]}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.panelTitle}>Student Tips</Text>
            <Text style={styles.panelSubtitle}>Best practices</Text>
          </View>

          <View style={styles.tipsGrid}>
            {dashboardTips.map((item) => (
              <View key={item.id} style={styles.tipCard}>
                <View style={[styles.tipIconWrap, { backgroundColor: item.iconBg }]}>
                  <Ionicons name={item.icon} size={18} color={item.iconColor} />
                </View>
                <Text style={styles.tipTitle}>{item.title}</Text>
                <Text style={styles.tipText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 20,
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
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
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
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clockCard: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'flex-end',
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
    marginTop: 10,
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
    marginTop: 10,
  },
  avatarFallbackText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
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
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    color: '#111827',
    fontWeight: '900',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.55,
  },
  workspaceGrid: {
    gap: 10,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e3e9f3',
    backgroundColor: '#f8fbff',
    padding: 10,
    minHeight: 112,
  },
  actionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  actionSubtitle: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  trackingPanel: {
    gap: 9,
  },
  concernCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ebeff6',
    backgroundColor: '#fcfdff',
    padding: 11,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 7,
  },
  concernHeaderLeft: {
    flex: 1,
  },
  concernRef: {
    color: '#9aa4b2',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  concernTitle: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  concernPreview: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 9,
  },
  progressTrack: {
    position: 'relative',
    height: 6,
    borderRadius: 8,
    justifyContent: 'center',
    marginBottom: 8,
  },
  progressRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 6,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
  },
  progressFill: {
    height: 6,
    borderRadius: 8,
    backgroundColor: '#0ea5e9',
  },
  concernTime: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  tipsPanel: {
    marginBottom: 2,
  },
  tipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8edf5',
    backgroundColor: '#fdfefe',
    padding: 10,
  },
  tipIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  tipText: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
