import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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
import FeedbackDistributionCard from '../components/FeedbackDistributionCard';

const SORT_OPTIONS = [
  { id: 'rating_desc', label: 'Highest' },
  { id: 'rating_asc', label: 'Lowest' },
  { id: 'latest', label: 'Latest' },
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

export default function FeedbackInsightsScreen({ navigation }) {
  const { token, user, logout } = useAuth();

  const [sortOption, setSortOption] = useState('rating_desc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchInsights = useCallback(async (targetSort, isRefresh) => {
    if (!token) { setLoading(false); setRefreshing(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setErrorMessage('');
    try {
      const response = await apiRequest(`/feedback/insights?sort=${targetSort}&limit=180`, { method: 'GET', token });
      setSummary(response.summary || null);
      setHistory(Array.isArray(response.history) ? response.history : []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInsights(sortOption, false);
  }, [fetchInsights, sortOption]);

  const [logoutScale] = useState(new Animated.Value(1));
  const handleLogoutPressIn = () => Animated.spring(logoutScale, { toValue: 0.9, useNativeDriver: true }).start();
  const handleLogoutPressOut = () => Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInsights(sortOption, true)} tintColor="#ffffff" />}
      >
        {/* ── Premium Header ── */}
        <LinearGradient
          colors={['#1e293b', '#0f172a', '#144966']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerHero}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="chevron-back" size={20} color="#ffffff" />
            </TouchableOpacity>
            <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={logout} 
                onPressIn={handleLogoutPressIn}
                onPressOut={handleLogoutPressOut}
                activeOpacity={1}
              >
                <Ionicons name="log-out-outline" size={18} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.headerContent}>
            <View style={styles.badge}>
              <Ionicons name="star" size={12} color="#fcd34d" />
              <Text style={styles.badgeText}>Insights</Text>
            </View>
            <Text style={styles.headerTitle}>Feedback & Ratings</Text>
            <Text style={styles.headerSub}>Analyze student satisfaction and app reviews.</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 60 }} />
          ) : (
            <>
              {!!errorMessage && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <FeedbackDistributionCard
                title="Overall Sentiment"
                subtitle="Based on total feedback received"
                averageRating={summary?.averageRating}
                totalRatings={summary?.totalFeedback}
                distribution={summary?.feedbackDistribution}
              />

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Full History</Text>
                <View style={styles.sortContainer}>
                  {SORT_OPTIONS.map(opt => (
                    <TouchableOpacity 
                      key={opt.id} 
                      style={[styles.sortPill, sortOption === opt.id && styles.sortPillActive]}
                      onPress={() => setSortOption(opt.id)}
                    >
                      <Text style={[styles.sortText, sortOption === opt.id && styles.sortTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {history.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="chatbox-ellipses-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No feedback recorded yet</Text>
                </View>
              ) : (
                history.map((item, idx) => (
                  <View key={item.id || idx} style={styles.historyCard}>
                    <View style={styles.historyTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{item.studentName || 'Student User'}</Text>
                        <Text style={styles.studentInfo}>{item.studentId || 'Anonymous'}</Text>
                      </View>
                      <View style={styles.ratingBox}>
                        <Ionicons name="star" size={14} color="#d97706" />
                        <Text style={styles.ratingVal}>{item.rating}</Text>
                      </View>
                    </View>
                    <Text style={styles.comment}>{item.comment || 'No comment provided.'}</Text>
                    <View style={styles.historyFooter}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  scrollWrap: { paddingBottom: 30 },
  headerHero: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, marginBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  logoutBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerContent: { },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(252,211,77,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, marginBottom: 10 },
  badgeText: { color: '#fcd34d', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginLeft: 6 },
  headerTitle: { color: '#ffffff', fontSize: 26, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginTop: 4 },
  body: { paddingHorizontal: 16, marginTop: -20 },
  errorBanner: { borderRadius: 14, backgroundColor: '#fef2f2', padding: 12, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  errorText: { color: '#b91c1c', fontSize: 13, fontWeight: '700', flex: 1 },
  sectionHeader: { marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 12 },
  sortContainer: { flexDirection: 'row', gap: 8 },
  sortPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  sortPillActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  sortText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  sortTextActive: { color: '#ffffff' },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, elevation: 1 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  studentName: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  studentInfo: { fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 2 },
  ratingBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fffbeb', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  ratingVal: { fontSize: 14, fontWeight: '900', color: '#b45309' },
  comment: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 12, fontWeight: '600' },
  historyFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  emptyWrap: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { marginTop: 12, fontSize: 14, fontWeight: '700', color: '#94a3b8' },
});
