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
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import FeedbackDistributionCard from '../components/FeedbackDistributionCard';

const SORT_OPTIONS = [
  { id: 'rating_desc', label: 'Highest Rating' },
  { id: 'rating_asc', label: 'Lowest Rating' },
  { id: 'latest', label: 'Latest' },
];

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function roleHeading(role) {
  const value = String(role || '').toLowerCase();
  if (value === 'owner') {
    return 'Owner Feedback Page';
  }

  if (value === 'admin') {
    return 'Admin Feedback Page';
  }

  if (value === 'consulter') {
    return 'Consulter Feedback Page';
  }

  return 'Feedback Page';
}

export default function FeedbackInsightsScreen({ navigation }) {
  const { token, user } = useAuth();

  const [sortOption, setSortOption] = useState('rating_desc');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchInsights = useCallback(async (targetSort, isRefresh) => {
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
      const response = await apiRequest(`/feedback/insights?sort=${targetSort}&limit=180`, {
        method: 'GET',
        token,
      });

      setSummary(response.summary || null);
      setHistory(Array.isArray(response.history) ? response.history : []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load feedback insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInsights(sortOption, false);
  }, [fetchInsights, sortOption]);

  const heading = useMemo(() => roleHeading(user?.role), [user?.role]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchInsights(sortOption, true)} tintColor="#334155" />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
            <Ionicons name="arrow-back" size={18} color="#111827" />
          </TouchableOpacity>

          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>{heading}</Text>
            <Text style={styles.subtitle}>Average ratings and full feedback history for the mobile app.</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#334155" />
            <Text style={styles.loaderText}>Loading feedback page...</Text>
          </View>
        ) : (
          <>
            {!!errorMessage && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color="#b91c1c" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <FeedbackDistributionCard
              title="Ratings and reviews"
              subtitle="Overall app feedback from student users"
              averageRating={summary?.averageRating}
              totalRatings={summary?.totalFeedback}
              distribution={summary?.feedbackDistribution}
            />

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Feedback History</Text>
                <Text style={styles.cardSub}>Sorted by your selected rating option.</Text>
              </View>

              <View style={styles.sortWrap}>
                {SORT_OPTIONS.map((option) => {
                  const active = sortOption === option.id;

                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.sortButton, active ? styles.sortButtonActive : null]}
                      onPress={() => setSortOption(option.id)}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.sortButtonText, active ? styles.sortButtonTextActive : null]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {history.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="chatbox-ellipses-outline" size={24} color="#94a3b8" />
                  <Text style={styles.emptyText}>No feedback history available.</Text>
                </View>
              ) : (
                <View style={styles.listWrap}>
                  {history.map((item, index) => (
                    <View key={item.id || `${item.studentEmail}-${index}`} style={styles.historyCard}>
                      <View style={styles.historyTopRow}>
                        <View style={styles.identityWrap}>
                          <Text style={styles.studentName}>{item.studentName || 'Student'}</Text>
                          <Text style={styles.studentMeta}>{item.studentId || 'No ID'} • {item.studentEmail || 'No email'}</Text>
                        </View>

                        <View style={styles.ratingPill}>
                          <Ionicons name="star" size={12} color="#d97706" />
                          <Text style={styles.ratingText}>{Number(item.rating || 0)} / 5</Text>
                        </View>
                      </View>

                      <Text style={styles.commentText}>{item.comment || 'No comment'}</Text>
                      <Text style={styles.timeText}>{formatDate(item.updatedAt || item.createdAt)}</Text>
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
    backgroundColor: '#eef2f7',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#dbe2ec',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerTextWrap: {
    flex: 1,
  },
  title: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  loaderCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce6f1',
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5ef',
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
  sortWrap: {
    paddingHorizontal: 12,
    paddingTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  sortButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d6dfeb',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortButtonActive: {
    borderColor: '#0f172a',
    backgroundColor: '#0f172a',
  },
  sortButtonText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  sortButtonTextActive: {
    color: '#ffffff',
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
  listWrap: {
    padding: 12,
    gap: 9,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce6f1',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 5,
  },
  identityWrap: {
    flex: 1,
  },
  studentName: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '900',
  },
  studentMeta: {
    marginTop: 1,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    color: '#7c2d12',
    fontSize: 11,
    fontWeight: '700',
  },
  commentText: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  timeText: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
});
