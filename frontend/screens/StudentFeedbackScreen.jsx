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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import FeedbackCard from '../components/FeedbackCard';

const STAR_VALUES = [1, 2, 3, 4, 5];

function formatDate(value) {
  if (!value) {
    return 'Recently submitted';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently submitted';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function ratingLabel(rating) {
  if (rating >= 5) {
    return 'Excellent';
  }

  if (rating >= 4) {
    return 'Good';
  }

  if (rating >= 3) {
    return 'Average';
  }

  if (rating >= 2) {
    return 'Needs Improvement';
  }

  if (rating >= 1) {
    return 'Poor';
  }

  return 'Select a rating';
}

export default function StudentFeedbackScreen({ navigation }) {
  const { token, user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [myFeedback, setMyFeedback] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const commentLength = comment.trim().length;

  const canSave = useMemo(() => {
    return Boolean(token) && rating >= 1 && commentLength >= 5 && !submitting;
  }, [commentLength, rating, submitting, token]);

  const hasExistingFeedback = Boolean(myFeedback?.id);

  const loadMyFeedback = useCallback(async () => {
    if (!token) {
      return;
    }

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
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load previous feedback');
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadMyFeedback();
    }, [loadMyFeedback])
  );

  const handleSaveFeedback = useCallback(async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (rating < 1 || rating > 5) {
      setErrorMessage('Please select a rating from 1 to 5');
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

      setSuccessMessage(response.message || (hasExistingFeedback ? 'Feedback updated successfully' : 'Feedback submitted successfully'));
      await loadMyFeedback();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to save feedback');
    } finally {
      setSubmitting(false);
    }
  }, [comment, commentLength, hasExistingFeedback, loadMyFeedback, rating, token]);

  const handleDeleteFeedback = useCallback(() => {
    Alert.alert(
      'Delete feedback',
      'Are you sure you want to delete your feedback?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setErrorMessage('');
            setSuccessMessage('');
            setDeleting(true);

            try {
              const response = await apiRequest('/feedback/mine', {
                method: 'DELETE',
                token,
              });

              setSuccessMessage(response.message || 'Feedback deleted successfully');
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView contentContainerStyle={styles.scrollWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.9}>
              <Ionicons name="arrow-back" size={18} color="#111827" />
            </TouchableOpacity>

            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Overall App Feedback</Text>
              <Text style={styles.subtitle}>Tell us how the SCMS mobile experience feels for you.</Text>
            </View>
          </View>

          <View style={styles.studentBadge}>
            <Ionicons name="person-circle-outline" size={15} color="#1f2937" />
            <Text style={styles.studentBadgeText}>
              {`${String(user?.firstName || '').trim()} ${String(user?.lastName || '').trim()}`.trim() || 'Student'}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Rate the app</Text>
            <Text style={styles.hintText}>
              {hasExistingFeedback
                ? 'You can update or delete your existing feedback.'
                : '1 means poor, 5 means excellent.'}
            </Text>

            <View style={styles.starRow}>
              {STAR_VALUES.map((value) => {
                const active = value <= rating;
                return (
                  <TouchableOpacity
                    key={value}
                    style={[styles.starButton, active ? styles.starButtonActive : null]}
                    onPress={() => setRating(value)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={active ? 'star' : 'star-outline'}
                      size={24}
                      color={active ? '#f59e0b' : '#9ca3af'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.ratingStatus}>{ratingLabel(rating)}</Text>

            <Text style={styles.sectionTitle}>Your feedback</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your overall thoughts about this app..."
              placeholderTextColor="#9ca3af"
              multiline
              maxLength={1200}
              style={styles.commentInput}
              textAlignVertical="top"
            />

            <Text style={styles.counterText}>{commentLength}/1200 characters</Text>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <TouchableOpacity
              style={[styles.submitButton, !canSave ? styles.submitButtonDisabled : null]}
              onPress={handleSaveFeedback}
              disabled={!canSave}
              activeOpacity={0.9}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name={hasExistingFeedback ? 'create-outline' : 'send-outline'} size={16} color="#ffffff" />
                  <Text style={styles.submitButtonText}>{hasExistingFeedback ? 'Update Feedback' : 'Submit Feedback'}</Text>
                </>
              )}
            </TouchableOpacity>

            {hasExistingFeedback ? (
              <TouchableOpacity
                style={[styles.deleteButton, deleting ? styles.deleteButtonDisabled : null]}
                onPress={handleDeleteFeedback}
                disabled={deleting}
                activeOpacity={0.9}
              >
                {deleting ? (
                  <ActivityIndicator color="#dc2626" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                    <Text style={styles.deleteButtonText}>Delete Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyHeaderRow}>
              <Text style={styles.sectionTitle}>My Feedback</Text>
              <Text style={styles.historyMeta}>{hasExistingFeedback ? '1 record' : '0 records'}</Text>
            </View>

            {loadingHistory ? (
              <View style={styles.historyLoaderWrap}>
                <ActivityIndicator size="small" color="#e53935" />
                <Text style={styles.historyLoaderText}>Loading feedback...</Text>
              </View>
            ) : !hasExistingFeedback ? (
              <View style={styles.emptyHistoryState}>
                <Ionicons name="chatbox-ellipses-outline" size={26} color="#94a3b8" />
                <Text style={styles.emptyHistoryTitle}>No feedback yet</Text>
                <Text style={styles.emptyHistoryText}>You can submit only one feedback. You can edit or delete it anytime.</Text>
              </View>
            ) : (
              <FeedbackCard
                rating={myFeedback.rating}
                comment={myFeedback.comment}
                category={`Updated ${formatDate(myFeedback.updatedAt || myFeedback.createdAt)}`}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f6',
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 26,
    gap: 12,
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
    color: '#111827',
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  studentBadge: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  studentBadgeText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  hintText: {
    marginTop: 3,
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  starButton: {
    width: 48,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe2ec',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  ratingStatus: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
  },
  commentInput: {
    minHeight: 130,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fbfcfe',
    color: '#111827',
    fontSize: 14,
    paddingHorizontal: 11,
    paddingVertical: 10,
    marginTop: 8,
  },
  counterText: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  errorText: {
    marginTop: 8,
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700',
  },
  successText: {
    marginTop: 8,
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#e53935',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 13,
  },
  submitButtonDisabled: {
    backgroundColor: '#f3a6a4',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  deleteButton: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.65,
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },
  historyCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyMeta: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyLoaderWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  historyLoaderText: {
    marginTop: 7,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyHistoryState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fbfcfe',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 10,
  },
  emptyHistoryTitle: {
    marginTop: 8,
    color: '#334155',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyHistoryText: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
