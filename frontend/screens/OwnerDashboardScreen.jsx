import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import OwnerAnalyticsSection from '../components/OwnerAnalyticsSection';

export default function OwnerDashboardScreen({ navigation }) {
  const { token, user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setRefreshing(true);
    // Trigger any necessary data refreshes
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const [logoutScale] = useState(new Animated.Value(1));

  const handleLogoutPressIn = () => {
    Animated.spring(logoutScale, { toValue: 0.9, useNativeDriver: true }).start();
  };
  const handleLogoutPressOut = () => {
    Animated.spring(logoutScale, { toValue: 1, useNativeDriver: true }).start();
  };

  const ownerName = user?.firstName || 'Owner';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollWrap}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchDashboardData} 
            tintColor="#ffffff" 
          />
        }
      >
        {/* ── Dynamic Premium Header ── */}
        <LinearGradient
          colors={['#1e293b', '#0f172a', '#7f1d1d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerHero}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>Welcome back,</Text>
              <Text style={styles.headerTitle}>{ownerName}</Text>
            </View>
            <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
              <TouchableOpacity 
                style={styles.logoutBtn} 
                onPress={logout} 
                onPressIn={handleLogoutPressIn}
                onPressOut={handleLogoutPressOut}
                activeOpacity={1}
              >
                <Ionicons name="log-out-outline" size={18} color="#ffffff" />
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.headerBadge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>System Administrator</Text>
            </View>
            <Text style={styles.headerSub}>Academy of Knowledge Bridge</Text>
          </View>

          <View style={styles.headerStatsRow}>
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>Live</Text>
              <Text style={styles.hStatLbl}>Status</Text>
            </View>
            <View style={styles.hStatDivider} />
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>Secure</Text>
              <Text style={styles.hStatLbl}>Database</Text>
            </View>
            <View style={styles.hStatDivider} />
            <View style={styles.hStat}>
              <Text style={styles.hStatVal}>AI</Text>
              <Text style={styles.hStatLbl}>Enabled</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.contentBody}>
          {/* Integrated Analytics Section */}
          <OwnerAnalyticsSection />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollWrap: {
    paddingBottom: 30,
  },
  headerHero: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerInfo: {
    marginBottom: 24,
  },
  headerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220,38,38,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.3)',
    marginBottom: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 6,
  },
  badgeText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hStat: {
    flex: 1,
    alignItems: 'center',
  },
  hStatVal: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 2,
  },
  hStatLbl: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  contentBody: {
    paddingHorizontal: 16,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  quickActionsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
});
