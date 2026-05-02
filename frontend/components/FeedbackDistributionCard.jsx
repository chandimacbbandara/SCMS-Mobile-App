import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function normalizeDistribution(distribution) {
  const normalized = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!distribution || typeof distribution !== 'object') return normalized;
  Object.keys(normalized).forEach((key) => {
    const value = Number(distribution[key] || distribution[Number(key)] || 0);
    normalized[key] = Number.isFinite(value) ? Math.max(0, value) : 0;
  });
  return normalized;
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
          <Text style={styles.averageValue}>{safeAverage.toFixed(1)}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((step) => {
              let iconName = 'star-outline';
              if (safeAverage >= step) iconName = 'star';
              else if (safeAverage >= step - 0.5) iconName = 'star-half';
              return <Ionicons key={step} name={iconName} size={15} color="#f59e0b" />;
            })}
          </View>
          <Text style={styles.totalText}>{safeTotalRatings.toLocaleString()} ratings</Text>
        </View>

        <View style={styles.distributionWrap}>
          {[5, 4, 3, 2, 1].map((score) => {
            const count = Number(safeDistribution[String(score)] || 0);
            const ratio = safeTotalRatings > 0 ? (count / safeTotalRatings) : 0;
            return (
              <View key={score} style={styles.distributionRow}>
                <Text style={styles.scoreLabel}>{score}</Text>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
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
  card: { backgroundColor: '#ffffff', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, elevation: 3 },
  title: { color: '#0f172a', fontSize: 18, fontWeight: '900' },
  subtitle: { marginTop: 2, color: '#64748b', fontSize: 12, fontWeight: '600' },
  contentRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 20 },
  averageBlock: { width: 110, alignItems: 'center' },
  averageValue: { color: '#0f172a', fontSize: 52, fontWeight: '900' },
  starRow: { marginTop: 4, flexDirection: 'row', gap: 2 },
  totalText: { marginTop: 4, color: '#64748b', fontSize: 11, fontWeight: '800' },
  distributionWrap: { flex: 1, gap: 8 },
  distributionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreLabel: { width: 12, color: '#475569', fontSize: 11, fontWeight: '800' },
  track: { flex: 1, height: 10, borderRadius: 99, backgroundColor: '#f1f5f9', overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99, backgroundColor: '#dc2626' },
  scoreCount: { minWidth: 28, textAlign: 'right', color: '#64748b', fontSize: 11, fontWeight: '700' },
});
