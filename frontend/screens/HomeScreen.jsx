import React from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const brandLogo = require('../images/img4.jpeg');

const featureList = [
  {
    id: 'f1',
    icon: 'shield-checkmark-outline',
    title: 'Private and secure',
    text: 'Your reports are handled with strict confidentiality.',
  },
  {
    id: 'f2',
    icon: 'time-outline',
    title: 'Fast response target',
    text: 'Concerns are acknowledged quickly with clear updates.',
  },
  {
    id: 'f3',
    icon: 'chatbubbles-outline',
    title: 'Transparent communication',
    text: 'Stay informed from submission to resolution.',
  },
];

const processSteps = [
  { id: 'p1', title: 'Create account', text: 'Register with your student details and verify your email.' },
  { id: 'p2', title: 'Submit concern', text: 'Write your issue clearly and attach any evidence if needed.' },
  { id: 'p3', title: 'Track progress', text: 'Follow status updates directly from your dashboard.' },
];

export default function HomeScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Student';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f7fc" />
      <ScrollView contentContainerStyle={styles.scrollWrap} showsVerticalScrollIndicator={false}>
        <View style={styles.appBar}>
          <View style={styles.brandWrap}>
            <Image source={brandLogo} style={styles.brandLogo} resizeMode="contain" />
            <View>
              <Text style={styles.brandName}>Knowledge Bridge</Text>
              <Text style={styles.brandSub}>Student Concern App</Text>
            </View>
          </View>

          {isAuthenticated ? (
            <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.9}>
              <Ionicons name="log-out-outline" size={16} color="#ffffff" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.loginGhostBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.9}>
              <Text style={styles.loginGhostText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        <LinearGradient
          colors={['#ef5350', '#e53935', '#b71c1c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={12} color="#ffffff" />
            <Text style={styles.heroBadgeText}>Academy of Knowledge Bridge</Text>
          </View>

          <Text style={styles.heroTitle}>
            {isAuthenticated ? `Welcome back, ${displayName}` : 'One mobile place for student concerns'}
          </Text>

          <Text style={styles.heroText}>
            Report issues confidently, receive meaningful updates, and track resolutions with a clear and modern student workflow.
          </Text>

          <View style={styles.heroActions}>
            {isAuthenticated ? (
              <View style={styles.heroInfoPill}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#ffffff" />
                <Text style={styles.heroInfoPillText}>You are signed in. Open your dashboard from app navigation.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => navigation.navigate('Register')} activeOpacity={0.9}>
                  <Text style={styles.primaryActionText}>Create Account</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.9}>
                  <Text style={styles.secondaryActionText}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>

        <View style={styles.quickStatsRow}>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>24h</Text>
            <Text style={styles.quickStatLabel}>Response target</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>100%</Text>
            <Text style={styles.quickStatLabel}>Confidential flow</Text>
          </View>
          <View style={styles.quickStatCard}>
            <Text style={styles.quickStatValue}>1</Text>
            <Text style={styles.quickStatLabel}>Unified portal</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Why students use this app</Text>
          {featureList.map((item) => (
            <View key={item.id} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons name={item.icon} size={18} color="#e53935" />
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{item.title}</Text>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {processSteps.map((item, index) => (
            <View key={item.id} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{index + 1}</Text>
              </View>
              <View style={styles.stepTextWrap}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerCard}>
          <Text style={styles.footerTitle}>Need help?</Text>
          <Text style={styles.footerLine}>Email: admin@akbinstitute.edu.lk</Text>
          <Text style={styles.footerLine}>Phone: 0717514859</Text>
          <Text style={styles.footerCopy}>AKB Creative Solution</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7fc',
  },
  scrollWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 24,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  brandLogo: {
    width: 58,
    height: 46,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  brandSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  loginGhostBtn: {
    borderWidth: 1,
    borderColor: '#d8e1ec',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  loginGhostText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e53935',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutBtnText: {
    marginLeft: 4,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 12,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  heroBadgeText: {
    marginLeft: 5,
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    lineHeight: 31,
    marginBottom: 8,
  },
  heroText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  heroActions: {
    gap: 8,
  },
  primaryActionBtn: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#b71c1c',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  heroInfoPill: {
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfoPillText: {
    marginLeft: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    lineHeight: 17,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  quickStatValue: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
  },
  quickStatLabel: {
    marginTop: 3,
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e9f2',
    backgroundColor: '#ffffff',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: '#fff2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  featureText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffeceb',
    borderWidth: 1,
    borderColor: '#fecaca',
    marginRight: 8,
  },
  stepBadgeText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTextWrap: {
    flex: 1,
    paddingTop: 1,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  stepText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  footerCard: {
    borderRadius: 14,
    backgroundColor: '#111827',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  footerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  footerLine: {
    color: '#d1d5db',
    fontSize: 12,
    marginBottom: 3,
    fontWeight: '600',
  },
  footerCopy: {
    marginTop: 6,
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
  },
});
