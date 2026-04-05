import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import StatCard from '../components/StatCard';
import ResourceCard from '../components/ResourceCard';
import FeedbackCard from '../components/FeedbackCard';
import { useAuth } from '../context/AuthContext';

const brandLogo = require('../images/img4.jpeg');
const heroVisualLogo = require('../images/img2.jpeg');

const statsData = [
  { id: '1', value: '24', label: 'Hour response commitment' },
  { id: '2', value: '100%', label: 'Confidential handling' },
  { id: '3', value: '5', label: 'Top feedback cards shown' },
  { id: '4', value: '1', label: 'Unified concern portal' },
];

const aboutItems = [
  {
    id: '1',
    title: 'Clear communication flow',
    text: 'Students can submit concerns and receive timely updates with less uncertainty.',
  },
  {
    id: '2',
    title: 'Strong institutional presence',
    text: 'A polished interface that reflects the standard and reputation of your academy.',
  },
  {
    id: '3',
    title: 'Secure and responsible process',
    text: 'Student information is handled with strict confidentiality and professionalism.',
  },
];

const resourcesData = [
  {
    id: '1',
    title: 'How to Submit a Concern',
    description:
      'Follow the streamlined process to raise academic or administrative concerns with confidence.',
    highlight: false,
    iconName: 'document-text-outline',
  },
  {
    id: '2',
    title: 'Our Response Timeline',
    description:
      'Every concern is acknowledged quickly and reviewed under a strict 24 hour response target.',
    highlight: true,
    iconName: 'time-outline',
  },
  {
    id: '3',
    title: 'Privacy and Security',
    description:
      'Your data and identity are protected under strict confidentiality and data protection policies.',
    highlight: false,
    iconName: 'shield-checkmark-outline',
  },
];

const feedbackData = [
  {
    id: '1',
    rating: 5,
    comment: 'Excellent support and very fast response from the team.',
    category: 'Academic',
  },
  {
    id: '2',
    rating: 5,
    comment: 'Clear communication from start to finish. Highly professional service.',
    category: 'Administration',
  },
  {
    id: '3',
    rating: 4,
    comment: 'Concern was handled carefully and I was updated throughout the process.',
    category: 'General',
  },
  {
    id: '4',
    rating: 5,
    comment: 'I felt safe sharing my concern. The process was transparent and respectful.',
    category: 'Welfare',
  },
  {
    id: '5',
    rating: 5,
    comment: 'The platform is simple to use and the response quality is excellent.',
    category: 'Student Life',
  },
];

function useRevealStyles() {
  const sectionAnim = useRef(Array.from({ length: 6 }, () => new Animated.Value(0))).current;

  useEffect(() => {
    sectionAnim.forEach((anim, idx) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 540,
        delay: 100 + idx * 120,
        useNativeDriver: true,
      }).start();
    });
  }, [sectionAnim]);

  return sectionAnim.map((anim) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  }));
}

export default function HomeScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const feedbackRef = useRef(null);
  const [feedbackIndex, setFeedbackIndex] = useState(0);

  const studentName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Student';

  const revealStyles = useRevealStyles();

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  const feedbackCardWidth = Math.min(310, Math.max(252, width * 0.76));
  const feedbackStep = feedbackCardWidth + 12;
  const maxFeedbackIndex = Math.max(0, feedbackData.length - 1);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 16000,
        useNativeDriver: true,
      })
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1700,
          useNativeDriver: true,
        }),
      ])
    );

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2100,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2100,
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();
    floatLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [spinAnim, pulseAnim, floatAnim]);

  const ringRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.88, 1.14],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.32, 0.8],
  });

  const floatTranslateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const goToFeedbackIndex = (index) => {
    const nextIndex = Math.max(0, Math.min(maxFeedbackIndex, index));
    setFeedbackIndex(nextIndex);
    if (feedbackRef.current) {
      feedbackRef.current.scrollToOffset({
        offset: nextIndex * feedbackStep,
        animated: true,
      });
    }
  };

  const handleFeedbackScrollEnd = (event) => {
    const offset = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(offset / feedbackStep);
    if (!Number.isNaN(nextIndex)) {
      setFeedbackIndex(Math.max(0, Math.min(maxFeedbackIndex, nextIndex)));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f8fc" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pageWrap}>
          <Animated.View style={[styles.heroShell, revealStyles[0]]}>
            <LinearGradient
              colors={['#ffffff', '#f6f9fd', '#edf3fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroSection}
            >
              <View style={styles.heroPattern} />

              <View style={styles.headerBar}>
                <View style={styles.brandWrap}>
                  <View style={styles.logoBadge}>
                    <Image source={brandLogo} style={styles.logoBadgeImage} resizeMode="contain" />
                  </View>
                  <View>
                    <Text style={styles.logoSmall}>Welcome, {studentName}</Text>
                    <Text style={styles.logoLarge}>Knowledge Bridge</Text>
                  </View>
                </View>

                <View style={styles.navPills}>
                  {isAuthenticated ? (
                    <>
                      <View style={[styles.navPill, styles.navPillActive]}>
                        <Text style={[styles.navPillText, styles.navPillTextActive]}>Home</Text>
                      </View>
                      <TouchableOpacity style={styles.navPill} onPress={logout}>
                        <Text style={styles.navPillText}>Logout</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <TouchableOpacity style={styles.navPill} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.navPillText}>Login</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.navPill, styles.navPillActive]} onPress={() => navigation.navigate('Register')}>
                        <Text style={[styles.navPillText, styles.navPillTextActive]}>Sign Up</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              <View style={styles.heroMain}>
                <View style={styles.heroContent}>
                  <Text style={styles.heroKicker}>ACADEMY OF KNOWLEDGE BRIDGE</Text>
                  <Text style={styles.heroTitle}>
                    Professional Student Concern Management for an Institute That Cares
                  </Text>
                  <Text style={styles.heroText}>
                    Raise concerns confidently, track progress clearly, and receive meaningful responses
                    quickly through one secure and structured platform.
                  </Text>

                  <View style={styles.heroActions}>
                    <TouchableOpacity
                      activeOpacity={0.9}
                      onPress={() => {
                        if (!isAuthenticated) {
                          navigation.navigate('Login');
                        }
                      }}
                    >
                      <LinearGradient
                        colors={['#e53935', '#b71c1c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.primaryBtn}
                      >
                        <Text style={styles.primaryBtnText}>{isAuthenticated ? 'Submit Concern' : 'Go to Login'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        if (!isAuthenticated) {
                          navigation.navigate('Register');
                        }
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>{isAuthenticated ? 'View Resources' : 'Create Account'}</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.heroTags}>
                    <Text style={styles.heroTag}>Immediate acknowledgement</Text>
                    <Text style={styles.heroTag}>24h resolution promise</Text>
                    <Text style={styles.heroTag}>Confidential support</Text>
                  </View>
                </View>

                <View style={styles.heroVisual}>
                  <Animated.View
                    style={[
                      styles.heroGlow,
                      {
                        opacity: pulseOpacity,
                        transform: [{ scale: pulseScale }],
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.heroRing,
                      {
                        transform: [{ rotate: ringRotation }],
                      },
                    ]}
                  />

                  <View style={[styles.heroOrb, styles.heroOrbOne]} />
                  <View style={[styles.heroOrb, styles.heroOrbTwo]} />
                  <View style={[styles.heroOrb, styles.heroOrbThree]} />

                  <Animated.View
                    style={[
                      styles.logoCard,
                      {
                        transform: [{ translateY: floatTranslateY }, { rotate: '-4deg' }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['#ffffff', '#f9fbff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.logoCardInner}
                    >
                      <Image source={heroVisualLogo} style={styles.heroLogoImage} resizeMode="contain" />
                    </LinearGradient>
                  </Animated.View>

                  <View style={[styles.heroChip, styles.heroChipTop]}>
                    <Text style={styles.heroChipText}>Institute-grade support process</Text>
                  </View>
                  <View style={[styles.heroChip, styles.heroChipBottom]}>
                    <Text style={styles.heroChipText}>Transparent and student-focused</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[styles.statsWrap, revealStyles[1]]}>
            <View style={styles.statsGrid}>
              {statsData.map((item) => (
                <StatCard key={item.id} value={item.value} label={item.label} />
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.sectionBlock, revealStyles[2]]}>
            <Text style={styles.sectionKicker}>ABOUT THE PLATFORM</Text>
            <Text style={styles.sectionTitle}>Built to represent your institute quality and trust</Text>

            <View style={styles.aboutMainCard}>
              <Text style={styles.aboutMainText}>
                This system helps students report concerns in a simple way while giving administrators a
                clear and accountable process to respond. The experience is designed to feel
                professional, safe, and transparent from start to finish.
              </Text>
            </View>

            {aboutItems.map((item) => (
              <View key={item.id} style={styles.aboutItemCard}>
                <Text style={styles.aboutItemTitle}>{item.title}</Text>
                <Text style={styles.aboutItemText}>{item.text}</Text>
              </View>
            ))}
          </Animated.View>

          <Animated.View style={[styles.sectionBlock, revealStyles[3]]}>
            <View style={styles.centerHeadingWrap}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionKicker}>RESOURCES</Text>
              <Text style={styles.sectionTitleCenter}>Student Support and Guidelines</Text>
              <View style={styles.sectionUnderline} />
            </View>

            <View>
              {resourcesData.map((item) => (
                <ResourceCard
                  key={item.id}
                  title={item.title}
                  description={item.description}
                  highlight={item.highlight}
                  iconName={item.iconName}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.sectionBlock, revealStyles[4]]}>
            <View style={styles.centerHeadingWrap}>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionKicker}>STUDENT VOICES</Text>
              <Text style={styles.sectionTitleCenter}>Best Student Feedback</Text>
              <View style={styles.sectionUnderline} />
            </View>

            <View style={styles.feedbackControls}>
              <TouchableOpacity
                style={[styles.feedbackArrow, feedbackIndex <= 0 && styles.feedbackArrowDisabled]}
                onPress={() => goToFeedbackIndex(feedbackIndex - 1)}
                disabled={feedbackIndex <= 0}
              >
                <Ionicons name="chevron-back" size={18} color="#1f2937" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.feedbackArrow,
                  feedbackIndex >= maxFeedbackIndex && styles.feedbackArrowDisabled,
                ]}
                onPress={() => goToFeedbackIndex(feedbackIndex + 1)}
                disabled={feedbackIndex >= maxFeedbackIndex}
              >
                <Ionicons name="chevron-forward" size={18} color="#1f2937" />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={feedbackRef}
              horizontal
              data={feedbackData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FeedbackCard
                  rating={item.rating}
                  comment={item.comment}
                  category={item.category}
                  width={feedbackCardWidth}
                />
              )}
              showsHorizontalScrollIndicator={false}
              snapToInterval={feedbackStep}
              decelerationRate="fast"
              contentContainerStyle={styles.feedbackList}
              onMomentumScrollEnd={handleFeedbackScrollEnd}
            />
          </Animated.View>

          <Animated.View style={[styles.sectionBlock, revealStyles[5]]}>
            <LinearGradient
              colors={['#ffffff', '#f8fbff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaCard}
            >
              <Text style={styles.ctaTitle}>Your voice deserves immediate action</Text>
              <Text style={styles.ctaText}>
                Submit concerns with confidence and let our institute support team take it forward.
              </Text>

              <TouchableOpacity activeOpacity={0.9}>
                <LinearGradient
                  colors={['#e53935', '#b71c1c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Start Now</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>

          <View style={styles.footerWrap}>
            <Image source={brandLogo} style={styles.footerLogo} resizeMode="contain" />
            <Text style={styles.footerBrand}>AKB CREATIVE SOLUTION</Text>
            <Text style={styles.footerSub}>Academy of Knowledge Bridge</Text>
            <Text style={styles.footerLine}>Email: admin@akbinstitute.edu.lk</Text>
            <Text style={styles.footerLine}>Tel: 0717514859</Text>
            <Text style={styles.footerCopy}>Copyright 2026 Academy of Knowledge Bridge</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f8fc',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  pageWrap: {
    width: '92%',
    alignSelf: 'center',
  },
  heroShell: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 4,
  },
  heroSection: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 22,
  },
  heroPattern: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 999,
    top: -80,
    right: -70,
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoBadgeImage: {
    width: '88%',
    height: '88%',
  },
  logoSmall: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  logoLarge: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '800',
  },
  navPills: {
    flexDirection: 'row',
  },
  navPill: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    marginLeft: 7,
  },
  navPillActive: {
    borderColor: '#f3c6c6',
    backgroundColor: '#fff3f3',
  },
  navPillText: {
    color: '#1f2937',
    fontSize: 12,
    fontWeight: '700',
  },
  navPillTextActive: {
    color: '#b91c1c',
  },
  heroMain: {
    flexDirection: 'column',
  },
  heroContent: {
    marginBottom: 18,
  },
  heroKicker: {
    letterSpacing: 2.5,
    color: '#e53935',
    fontWeight: '800',
    fontSize: 11,
    marginBottom: 9,
  },
  heroTitle: {
    color: '#111827',
    fontSize: 34,
    lineHeight: 39,
    fontWeight: '800',
    marginBottom: 10,
  },
  heroText: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 15,
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 13,
  },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 22,
    marginRight: 10,
    marginBottom: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#111827',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  secondaryBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '800',
  },
  heroTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  heroTag: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: '#374151',
    fontSize: 12,
    fontWeight: '700',
    paddingVertical: 7,
    paddingHorizontal: 11,
    marginRight: 8,
    marginBottom: 8,
  },
  heroVisual: {
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heroGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 57, 53, 0.3)',
  },
  heroRing: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(229, 57, 53, 0.26)',
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: 999,
  },
  heroOrbOne: {
    width: 16,
    height: 16,
    top: 52,
    left: 20,
    backgroundColor: '#e53935',
  },
  heroOrbTwo: {
    width: 12,
    height: 12,
    bottom: 70,
    right: 24,
    backgroundColor: '#111827',
  },
  heroOrbThree: {
    width: 8,
    height: 8,
    top: 130,
    right: 2,
    backgroundColor: 'rgba(229,57,53,0.75)',
  },
  logoCard: {
    width: 214,
    height: 214,
    borderRadius: 24,
  },
  logoCardInner: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 8,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 6,
  },
  heroLogoImage: {
    width: '86%',
    height: '86%',
  },
  heroChip: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 3,
  },
  heroChipTop: {
    top: 34,
    right: 4,
  },
  heroChipBottom: {
    bottom: 32,
    left: 4,
  },
  heroChipText: {
    color: '#1f2937',
    fontSize: 11,
    fontWeight: '700',
  },
  statsWrap: {
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  sectionBlock: {
    marginBottom: 22,
  },
  sectionKicker: {
    letterSpacing: 2.4,
    color: '#e53935',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionTitleCenter: {
    color: '#111827',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  centerHeadingWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionDivider: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e53935',
    marginBottom: 18,
  },
  sectionUnderline: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e53935',
    marginTop: 14,
  },
  aboutMainCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 18,
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  aboutMainText: {
    color: '#556173',
    fontSize: 14,
    lineHeight: 23,
  },
  aboutItemCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
    borderRadius: 14,
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  aboutItemTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  aboutItemText: {
    color: '#556173',
    fontSize: 14,
    lineHeight: 21,
  },
  feedbackControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  feedbackArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  feedbackArrowDisabled: {
    opacity: 0.45,
  },
  feedbackList: {
    paddingTop: 2,
    paddingBottom: 3,
  },
  ctaCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  ctaTitle: {
    color: '#111827',
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaText: {
    color: '#556173',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 14,
  },
  footerWrap: {
    marginTop: 6,
    backgroundColor: '#111827',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  footerLogo: {
    width: 190,
    height: 70,
    marginBottom: 6,
  },
  footerBrand: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerSub: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 3,
  },
  footerLine: {
    color: '#c7ced9',
    fontSize: 12,
    marginTop: 8,
  },
  footerCopy: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 10,
  },
});
