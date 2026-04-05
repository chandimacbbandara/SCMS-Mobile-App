import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function makeStars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating || 0)));
  const full = '★'.repeat(value);
  const empty = '☆'.repeat(5 - value);
  return full + empty;
}

export default function FeedbackCard({ rating, comment, category, width }) {
  return (
    <View style={[styles.card, width ? { width } : null]}>
      <Text style={styles.stars}>{makeStars(rating)} <Text style={styles.starsMeta}>({rating}/5)</Text></Text>
      <Text style={styles.comment}>{comment}</Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>{category}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 15,
    marginRight: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  stars: {
    color: '#f59e0b',
    fontSize: 18,
    marginBottom: 9,
  },
  starsMeta: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
  },
  comment: {
    color: '#334155',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  meta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    backgroundColor: '#f7f8fb',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  metaText: {
    color: '#4b5563',
    fontSize: 12,
    fontWeight: '700',
  },
});
