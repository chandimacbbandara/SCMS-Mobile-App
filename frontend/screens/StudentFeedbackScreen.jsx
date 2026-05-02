import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import FeedbackCard from '../components/FeedbackCard';
import FeedbackDistributionCard from '../components/FeedbackDistributionCard';

const STAR_VALUES = [1, 2, 3, 4, 5];
const SORT_OPTIONS = [
  { id: 'rating_desc', label: 'Highest Rating', icon: 'trending-up' },
  { id: 'rating_asc', label: 'Lowest Rating', icon: 'trending-down' },
  { id: 'latest', label: 'Latest', icon: 'time-outline' },
];

function formatDate(value) {
  if (!value) return 'Recently submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently submitted';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(value) {
  if (!value) return 'Recently submitted';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently submitted';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ratingLabel(rating) {
  if (rating >= 5) return 'Excellent';
  if (rating >= 4) return 'Good';
  if (rating >= 3) return 'Average';
  if (rating >= 2) return 'Needs Improvement';
  if (rating >= 1) return 'Poor';
  return 'Select a rating';
}

export default function StudentFeedbackScreen({ navigation }) {
  const { token, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [myFeedback, setMyFeedback] = useState(null);
  const [overallSummary, setOverallSummary] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [sortOption, setSortOption] = useState('rating_desc');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const commentLength = comment.trim().length;

  const canSave = useMemo(() => {
    return Boolean(token) && rating >= 1 && commentLength >= 5 && !submitting;
  }, [commentLength, rating, submitting, token]);

  const hasExistingFeedback = Boolean(myFeedback?.id || myFeedback?._id);

  const loadMyFeedback = useCallback(async () => {
    if (!token) return;

    setLoadingHistory(true);
    try {
      const response = await apiRequest('/feedback/mine', {
        method: 'GET',
        token,
      });

      const history = Array.isArray(response.feedback) ? response.feedback : [];
      const latest = history[0] || null;

      setMyFeedback(latest);

      if (latest) {
        setRating(Number(latest.rating || 0));
        setComment(String(latest.comment || ''));
      } else {
        setRating(0);
        setComment('');
      }

      try {
        const insightsResponse = await apiRequest(`/feedback/insights?sort=${sortOption}&limit=80`, {
          method: 'GET',
          token,
        });
        setOverallSummary(insightsResponse.summary || null);
        setFeedbackHistory(Array.isArray(insightsResponse.history) ? insightsResponse.history : []);
      } catch (insightsError) {
        setOverallSummary(null);
        setFeedbackHistory([]);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load feedback');
    } finally {
      setLoadingHistory(false);
    }
  }, [sortOption, token]);

  useFocusEffect(
    useCallback(() => {
      loadMyFeedback();
    }, [loadMyFeedback])
  );

  const handleSaveFeedback = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating');
      return;
    }

    if (commentLength < 5) {
      setErrorMessage('Please type at least 5 characters');
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiRequest(hasExistingFeedback ? '/feedback/mine' : '/feedback/overall', {
        method: hasExistingFeedback ? 'PUT' : 'POST',
        token,
        body: {
          rating,
          comment: comment.trim(),
        },
      });

      Alert.alert('Success', hasExistingFeedback ? 'Feedback updated!' : 'Feedback submitted!');
      await loadMyFeedback();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save feedback');
    } finally {
      setSubmitting(false);
    }
  }, [comment, commentLength, hasExistingFeedback, loadMyFeedback, rating, token]);

  const handleDeleteFeedback = useCallback(() => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to remove your feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await apiRequest('/feedback/mine', {
                method: 'DELETE',
                token,
              });
              Alert.alert('Deleted', 'Your feedback has been removed.');
              await loadMyFeedback();
            } catch (error) {
              setErrorMessage(error.message || 'Failed to delete feedback');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [loadMyFeedback, token]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Feedback</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['#e53935', '#b71c1c']}
            style={styles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="chatbubbles-outline" size={40} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
            <Text style={styles.bannerTitle}>Share Your Thoughts</Text>
            <Text style={styles.bannerSubtitle}>
              Your feedback helps us create a better experience for all students.
            </Text>
          </LinearGradient>

          <View style={styles.contentWrap}>
            {/* Summary Card */}
            <View style={styles.mainCard}>
              <FeedbackDistributionCard
                averageRating={overallSummary?.averageRating}
                totalRatings={overallSummary?.totalFeedback}
                distribution={overallSummary?.feedbackDistribution}
              />
            </View>

            {/* Rating Form Card */}
            <View style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.sectionTitle}>{hasExistingFeedback ? 'Update Your Rating' : 'Rate Your Experience'}</Text>
                <View style={styles.userBadge}>
                  <Ionicons name="person" size={12} color="#64748b" />
                  <Text style={styles.userBadgeText}>{user?.firstName}</Text>
                </View>
              </View>

              <View style={styles.starContainer}>
                {STAR_VALUES.map((value) => {
                  const active = value <= rating;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.starBox, active && styles.starBoxActive]}
                      onPress={() => setRating(value)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={active ? 'star' : 'star-outline'}
                        size={28}
                        color={active ? '#f59e0b' : '#94a3b8'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={[styles.ratingHint, rating > 0 && { color: '#b45309' }]}>
                {ratingLabel(rating)}
              </Text>

              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>Detailed Feedback</Text>
                <TextInput
                  style={styles.textArea}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Tell us what you like or what we can improve..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  maxLength={1200}
                  textAlignVertical="top"
                />
                <Text style={[styles.charCount, commentLength < 5 && { color: '#ef4444' }]}>
                  {commentLength} / 1200 chars
                </Text>
              </View>

              {errorMessage ? <Text style={styles.errorLabel}>{errorMessage}</Text> : null}

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[styles.submitBtn, !canSave && styles.submitBtnDisabled]}
                  onPress={handleSaveFeedback}
                  disabled={!canSave}
                >
                  <LinearGradient
                    colors={['#e53935', '#b71c1c']}
                    style={styles.btnGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name={hasExistingFeedback ? "refresh" : "send"} size={18} color="#ffffff" />
                        <Text style={styles.btnText}>{hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {hasExistingFeedback && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleDeleteFeedback}
                    disabled={deleting}
                  >
                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* History Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitleMain}>Community Feedback</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{feedbackHistory.length}</Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
              {SORT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortChip, sortOption === opt.id && styles.sortChipActive]}
                  onPress={() => setSortOption(opt.id)}
                >
                  <Ionicons 
                    name={opt.icon} 
                    size={14} 
                    color={sortOption === opt.id ? "#ffffff" : "#64748b"} 
                  />
                  <Text style={[styles.sortChipText, sortOption === opt.id && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loadingHistory ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator color="#e53935" size="large" />
                <Text style={styles.loaderText}>Syncing feedback...</Text>
              </View>
            ) : feedbackHistory.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No community feedback yet.</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {feedbackHistory.map((item, idx) => (
                  <View key={item.id || idx} style={styles.historyCard}>
                    <View style={styles.historyCardTop}>
                      <View style={styles.historyAvatar}>
                        <Text style={styles.avatarText}>{item.studentName?.charAt(0) || 'S'}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{item.studentName || 'Anonymous Student'}</Text>
                        <Text style={styles.historyDate}>{formatDateTime(item.updatedAt || item.createdAt)}</Text>
                      </View>
                      <View style={styles.historyRating}>
                        <Ionicons name="star" size={14} color="#f59e0b" />
                        <Text style={styles.historyRatingText}>{item.rating}/5</Text>
                      </View>
                    </View>
                    <Text style={styles.historyComment}>{item.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
  scrollContent: {
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: '100%',
    marginTop: 10,
  },
  heroBanner: {
    padding: 24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    top: -10,
    transform: [{ rotate: '-15deg' }],
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  contentWrap: {
    marginTop: -24,
    paddingHorizontal: 20,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  starBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBoxActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  ratingHint: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputWrap: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 10,
  },
  textArea: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    fontSize: 14,
    color: '#1e293b',
    minHeight: 120,
    fontWeight: '500',
  },
  charCount: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 6,
  },
  errorLabel: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
  },
  submitBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  deleteBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  countBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e53935',
  },
  sortScroll: {
    marginBottom: 20,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  sortChipActive: {
    backgroundColor: '#e53935',
    borderColor: '#e53935',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  sortChipTextActive: {
    color: '#ffffff',
  },
  loaderWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  historyList: {
    gap: 16,
    paddingBottom: 40,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  historyAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e53935',
  },
  historyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  historyDate: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 2,
  },
  historyRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  historyRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#b45309',
  },
  historyComment: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
});
