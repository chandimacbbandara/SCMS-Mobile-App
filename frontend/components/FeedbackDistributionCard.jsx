import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function normalizeDistribution(distribution) {
  const normalized = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  if (!distribution || typeof distribution !== 'object') {
    return normalized;
  }

  Object.keys(normalized).forEach((key) => {
    const value = Number(distribution[key] || distribution[Number(key)] || 0);
    normalized[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
  });

  return normalized;
}

function formatAverage(averageRating) {
  const value = Number(averageRating || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '0.0';
  }

  return value.toFixed(1);
}

function formatCount(totalRatings) {
  const value = Number(totalRatings || 0);
  if (!Number.isFinite(value) || value <= 0) {
    return '0';
  }

  return Math.round(value).toLocaleString();
}

export default function FeedbackDistributionCard({
  title = 'Ratings and reviews',
  subtitle = 'Overall app feedback from students',
  averageRating,
  totalRatings,
  distribution,
}) {
  const safeAverage = Number(averageRating || 0);
  const safeTotalRatings = Math.max(0, Number(totalRatings || 0));
  const safeDistribution = useMemo(() => normalizeDistribution(distribution), [distribution]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.contentRow}>
        <View style={styles.averageBlock}>
          <Text style={styles.averageValue}>{formatAverage(safeAverage)}</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((step) => {
              let iconName = 'star-outline';
              if (safeAverage >= step) {
                iconName = 'star';
              } else if (safeAverage >= step - 0.5) {
                iconName = 'star-half';
              }

              return <Ionicons key={step} name={iconName} size={15} color="#f59e0b" />;
            })}
          </View>

          <Text style={styles.totalText}>{formatCount(safeTotalRatings)} ratings</Text>
        </View>

        <View style={styles.distributionWrap}>
          {[5, 4, 3, 2, 1].map((score) => {
            const count = Number(safeDistribution[String(score)] || 0);
            const ratio = safeTotalRatings > 0 ? (count / safeTotalRatings) : 0;
            const widthPercent = `${Math.max(0, Math.min(100, ratio * 100))}%`;

            return (
              <View key={score} style={styles.distributionRow}>
                <Text style={styles.scoreLabel}>{score}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: widthPercent }]} />
                </View>
                <Text style={styles.scoreCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dbe5ef',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  title: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 4,
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  contentRow: {
    marginTop: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  averageBlock: {
    width: 106,
    alignItems: 'center',
  },
  averageValue: {
    color: '#0f172a',
    fontSize: 48,
    lineHeight: 52,
    fontWeight: '900',
  },
  starRow: {
    marginTop: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  totalText: {
    marginTop: 3,
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
  distributionWrap: {
    flex: 1,
    gap: 6,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  scoreLabel: {
    width: 10,
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#9fc0ff',
  },
  scoreCount: {
    minWidth: 28,
    textAlign: 'right',
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
});
