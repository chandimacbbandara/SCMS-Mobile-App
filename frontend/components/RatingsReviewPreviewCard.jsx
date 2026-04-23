import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import FeedbackDistributionCard from './FeedbackDistributionCard';

function formatDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date unavailable';
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function renderStars(rating) {
  const score = Math.max(0, Math.min(5, Math.round(Number(rating || 0))));

  return [1, 2, 3, 4, 5].map((step) => {
    const iconName = step <= score ? 'star' : 'star-outline';
    return <Ionicons key={step} name={iconName} size={13} color="#f59e0b" />;
  });
}

export default function RatingsReviewPreviewCard({
  summary,
  reviews,
  errorMessage,
  title = 'Ratings and reviews',
  subtitle = 'Verified app feedback from students',
  reviewsTitle = 'Recent reviews',
}) {
  const recentReviews = useMemo(() => {
    if (!Array.isArray(reviews)) {
      return [];
    }

    return reviews.slice(0, 3);
  }, [reviews]);

  return (
    <View style={styles.wrap}>
      <FeedbackDistributionCard
        title={title}
        subtitle={subtitle}
        averageRating={summary?.averageRating}
        totalRatings={summary?.totalFeedback}
        distribution={summary?.feedbackDistribution}
      />

      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle}>{reviewsTitle}</Text>
          <Text style={styles.reviewSub}>Latest student feedback snippets</Text>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={14} color="#b91c1c" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {recentReviews.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="chatbox-ellipses-outline" size={22} color="#94a3b8" />
            <Text style={styles.emptyText}>No review comments available yet.</Text>
          </View>
        ) : (
          <View style={styles.reviewList}>
            {recentReviews.map((entry, index) => {
              const identityParts = [entry?.studentId, entry?.studentEmail].filter((value) => String(value || '').trim() !== '');

              return (
                <View key={entry?.id || `${entry?.studentName || 'student'}-${index}`} style={styles.reviewItem}>
                  <View style={styles.reviewTopRow}>
                    <View style={styles.identityWrap}>
                      <Text style={styles.studentName}>{entry?.studentName || 'Student'}</Text>
                      <Text style={styles.studentMeta}>
                        {identityParts.length > 0 ? identityParts.join(' • ') : 'Student feedback'}
                      </Text>
                    </View>

                    <Text style={styles.dateText}>{formatDate(entry?.createdAt || entry?.updatedAt)}</Text>
                  </View>

                  <View style={styles.starRow}>
                    {renderStars(entry?.rating)}
                    <Text style={styles.starLabel}>{Number(entry?.rating || 0)} / 5</Text>
                  </View>

                  <Text style={styles.commentText} numberOfLines={3}>{entry?.comment || 'No comment provided.'}</Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  reviewCard: {
    marginTop: -2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  reviewHeader: {
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eef6',
    backgroundColor: '#fbfdff',
  },
  reviewTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '900',
  },
  reviewSub: {
    marginTop: 2,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  errorBanner: {
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 5,
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  emptyWrap: {
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 6,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewList: {
    padding: 12,
    gap: 9,
  },
  reviewItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce6f1',
    backgroundColor: '#f8fafc',
    padding: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
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
    fontSize: 10,
    fontWeight: '600',
  },
  dateText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 5,
  },
  starLabel: {
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
});
