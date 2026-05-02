import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

function StarRating({ rating }) {
  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Ionicons 
          key={value} 
          name={value <= safeRating ? "star" : "star-outline"} 
          size={16} 
          color="#f59e0b" 
        />
      ))}
      <Text style={styles.starsMeta}>({safeRating}/5)</Text>
    </View>
  );
}

export default function FeedbackCard({ rating, comment, category, width }) {
  return (
    <View style={[styles.card, width ? { width } : null]}>
      <StarRating rating={rating} />
      <Text style={styles.comment} numberOfLines={3}>{comment}</Text>
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
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  starsMeta: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
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
