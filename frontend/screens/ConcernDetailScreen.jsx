// screens/ConcernDetailScreen.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

const ConcernDetailScreen = ({ route, navigation }) => {
  const { concern } = route.params;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'reviewing':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      default:
        return '#999';
    }
  };

  const downloadMedicalReport = () => {
    // Implement download functionality
    Alert.alert('Download', 'Medical report download feature');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.genre}>{concern.genre}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(concern.status) }]}>
          <Text style={styles.statusText}>
            {concern.status.charAt(0).toUpperCase() + concern.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{concern.description}</Text>
      </View>

      {concern.medicalReport && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medical Report</Text>
          <TouchableOpacity style={styles.downloadButton} onPress={downloadMedicalReport}>
            <Ionicons name="document-attach" size={20} color="#fff" />
            <Text style={styles.downloadButtonText}>View Medical Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {concern.adminReply && (
        <View style={[styles.section, styles.replySection]}>
          <Text style={styles.sectionTitle}>Admin Response</Text>
          <View style={styles.replyContainer}>
            <Ionicons name="chatbubble" size={20} color="#4caf50" />
            <Text style={styles.replyText}>{concern.adminReply}</Text>
            <Text style={styles.replyDate}>
              {new Date(concern.repliedAt).toLocaleString()}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.metaInfo}>
        <Text style={styles.metaText}>
          Submitted: {new Date(concern.createdAt).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genre: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  downloadButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  replySection: {
    backgroundColor: '#e8f5e9',
  },
  replyContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  replyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 8,
  },
  replyDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  metaInfo: {
    padding: 20,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default ConcernDetailScreen;