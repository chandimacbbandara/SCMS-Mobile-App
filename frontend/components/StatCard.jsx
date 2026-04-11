import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function StatCard({ value, label }) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    marginHorizontal: 5,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  value: {
    color: '#e53935',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    color: '#4b5563',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
});
