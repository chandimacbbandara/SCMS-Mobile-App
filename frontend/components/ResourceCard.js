import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ResourceCard({ title, description, highlight, iconName }) {
  return (
    <View style={[styles.card, highlight && styles.highlightCard]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName || 'information-circle-outline'} size={18} color="#e53935" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  highlightCard: {
    borderColor: '#ffd4d4',
    backgroundColor: '#fff7f7',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#f5c7c7',
    backgroundColor: '#fff1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: '#556173',
    fontSize: 14,
    lineHeight: 22,
  },
});
