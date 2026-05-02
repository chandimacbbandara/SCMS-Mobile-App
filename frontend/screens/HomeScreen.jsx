import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
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

const brandLogo = require('../images/img2.jpeg');
const { width } = Dimensions.get('window');

/* ─────────────────────────────────────────
   DATA
───────────────────────────────────────── */
const featureList = [
  {
    id: 'f1',
    icon: 'shield-checkmark',
    title: 'Private & Secure',
    text: 'Your reports are handled with strict confidentiality and encryption.',
  },
  {
    id: 'f2',
    icon: 'flash',
    title: 'Fast Response',
    text: 'Concerns are acknowledged within 24 hours with real-time updates.',
  },
  {
    id: 'f3',
    icon: 'chatbubbles',
    title: 'Transparent',
    text: 'Stay fully informed from submission through to final resolution.',
  },
];

const processSteps = [
  {
    id: 'p1',
    icon: 'person-add',
    title: 'Create Account',
    text: 'Register with your student details and verify your email to get started.',
  },
  {
    id: 'p2',
    icon: 'document-text',
    title: 'Submit Concern',
    text: 'Describe your issue clearly and attach any supporting evidence if needed.',
  },
  {
    id: 'p3',
    icon: 'stats-chart',
    title: 'Track Progress',
    text: 'Follow live status updates directly from your personal dashboard.',
  },
];

/* ─────────────────────────────────────────
   PARTICLE
───────────────────────────────────────── */
function Particle({ x, delay, size = 4 }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
          Animated.timing(y, { toValue: -40, duration: 2400, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          Animated.timing(y, { toValue: -60, duration: 600, useNativeDriver: true }),
        ]),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: 30,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#e53935',
        opacity,
        transform: [{ translateY: y }],
      }}
    />
  );
}

/* ─────────────────────────────────────────
   HERO LOGO — centrepiece with rings
───────────────────────────────────────── */
function HeroLogo() {
  const float = useRef(new Animated.Value(0)).current;
  const ring1Rotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const entrance = useRef(new Animated.Value(0)).current;
  const entranceScale = useRef(new Animated.Value(0.6)).current;
  const shimmer = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entranceScale, { toValue: 1, tension: 55, friction: 8, delay: 200, useNativeDriver: true }),
      Animated.timing(entrance, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -12, duration: 2000, useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ring1Rotate, { toValue: 1, duration: 9000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ring2Rotate, { toValue: 1, duration: 6000, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ring1Scale, { toValue: 1.06, duration: 1600, useNativeDriver: true }),
        Animated.timing(ring1Scale, { toValue: 1, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1800, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 180, duration: 2000, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(shimmer, { toValue: -150, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const r1 = ring1Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  return (
    <Animated.View style={[styles.heroLogoWrap, { opacity: entrance, transform: [{ scale: entranceScale }] }]}>
      <Animated.View style={[styles.heroGlow, { opacity: glow }]} />
      <Animated.View style={[styles.ring1, { transform: [{ rotate: r1 }, { scale: ring1Scale }] }]} />
      <Animated.View style={[styles.ring2, { transform: [{ rotate: r2 }] }]} />
      <View style={styles.ring3} />

      <Animated.View style={[styles.heroImgContainer, { transform: [{ translateY: float }] }]}>
        <Image source={brandLogo} style={styles.heroImg} resizeMode="cover" />
        <Animated.View style={[styles.heroShimmer, { transform: [{ translateX: shimmer }] }]} />
        <View style={styles.liveDot}>
          <View style={styles.liveDotInner} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.orbitDot1, { transform: [{ rotate: r1 }] }]}>
        <View style={styles.orbitDotRed} />
      </Animated.View>
      <Animated.View style={[styles.orbitDot2, { transform: [{ rotate: r2 }] }]}>
        <View style={styles.orbitDotWhite} />
      </Animated.View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────
   FEATURE CARD
───────────────────────────────────────── */
function FeatureCard({ item, index }) {
  const scale = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, delay: 800 + index * 150, tension: 70, friction: 9, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: 800 + index * 150, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideY }, { scale }] }}>
      <Pressable
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <LinearGradient colors={['#ffffff', '#fcfcfc']} style={styles.featureCard}>
          <View style={styles.featureIconBox}>
            <Ionicons name={item.icon} size={22} color="#e53935" />
          </View>
          <Text style={styles.featureCardTitle}>{item.title}</Text>
          <Text style={styles.featureCardText}>{item.text}</Text>
          <View style={styles.featureCardFoot}>
            <Text style={styles.featureCardLearn}>Learn more</Text>
            <Ionicons name="arrow-forward" size={12} color="#e53935" />
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────
   STEP ROW — accordion
───────────────────────────────────────── */
function StepRow({ item, index, isActive, onPress }) {
  const expandH = useRef(new Animated.Value(0)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandH, { toValue: isActive ? 1 : 0, tension: 80, friction: 10, useNativeDriver: false }),
      Animated.timing(bgAnim, { toValue: isActive ? 1 : 0, duration: 250, useNativeDriver: false }),
    ]).start();
  }, [isActive]);

  const animH = expandH.interpolate({ inputRange: [0, 1], outputRange: [0, 52] });
  const bgColor = bgAnim.interpolate({ inputRange: [0, 1], outputRange: ['#ffffff', '#fff5f5'] });

  return (
    <Animated.View style={[styles.stepCard, { backgroundColor: bgColor }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.stepCardHead}>
        <LinearGradient
          colors={isActive ? ['#e53935', '#b71c1c'] : ['#2a2a2a', '#222222']}
          style={styles.stepNum}
        >
          <Text style={[styles.stepNumText, isActive && { color: '#fff' }]}>{index + 1}</Text>
        </LinearGradient>
        <View style={styles.stepInfo}>
          <View style={styles.stepIconRow}>
            <Ionicons name={item.icon} size={13} color={isActive ? '#e53935' : '#4b5563'} />
            <Text style={[styles.stepTitle, isActive && styles.stepTitleActive]}>{item.title}</Text>
          </View>
        </View>
        <Ionicons
          name={isActive ? 'remove-circle' : 'add-circle'}
          size={20}
          color={isActive ? '#e53935' : '#2a2a2a'}
        />
      </TouchableOpacity>
      <Animated.View style={{ height: animH, overflow: 'hidden' }}>
        <Text style={styles.stepBodyText}>{item.text}</Text>
      </Animated.View>
    </Animated.View>
  );
}

/* ─────────────────────────────────────────
   MAIN SCREEN
───────────────────────────────────────── */
export default function HomeScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [activeStep, setActiveStep] = useState(null);

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : 'Student';

  const topBarY = useRef(new Animated.Value(-30)).current;
  const topBarO = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleO = useRef(new Animated.Value(0)).current;
  const ctaY = useRef(new Animated.Value(20)).current;
  const ctaO = useRef(new Animated.Value(0)).current;

  const loginScale = useRef(new Animated.Value(1)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;
  const registerScale = useRef(new Animated.Value(1)).current;

  const pressIn = (a) => Animated.spring(a, { toValue: 0.93, useNativeDriver: true }).start();
  const pressOut = (a) => Animated.spring(a, { toValue: 1, useNativeDriver: true }).start();

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(topBarY, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(topBarO, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(titleO, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ctaY, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(ctaO, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f6f9" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} bounces>

        {/* ── TOP BAR ── */}
        <Animated.View style={[styles.topBar, { opacity: topBarO, transform: [{ translateY: topBarY }] }]}>
          <View style={styles.topBadge}>
            <View style={styles.topBadgeDot} />
            <Text style={styles.topBadgeText}>AKB Institute</Text>
          </View>

          {isAuthenticated ? (
            <Animated.View style={{ transform: [{ scale: logoutScale }] }}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={logout}
                onPressIn={() => pressIn(logoutScale)}
                onPressOut={() => pressOut(logoutScale)}
                activeOpacity={1}
              >
                <Ionicons name="log-out-outline" size={14} color="#fff" />
                <Text style={styles.logoutTxt}>Logout</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Animated.View style={{ transform: [{ scale: loginScale }] }}>
              <TouchableOpacity
                style={styles.loginBtn}
                onPress={() => navigation.navigate('Login')}
                onPressIn={() => pressIn(loginScale)}
                onPressOut={() => pressOut(loginScale)}
                activeOpacity={1}
              >
                <Ionicons name="person-outline" size={14} color="#e53935" />
                <Text style={styles.loginTxt}>Login</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* ── HERO ── */}
        <View style={styles.heroSection}>
          {[40, 90, 150, 200, 260, 310].map((x, i) => (
            <Particle key={i} x={x} delay={i * 400} size={i % 2 === 0 ? 4 : 3} />
          ))}

          <HeroLogo />

          <Animated.View style={[styles.heroTitleBlock, { opacity: titleO, transform: [{ translateY: titleY }] }]}>
            <Text style={styles.heroAcademy}>Academy of Knowledge Bridge</Text>
            <Text style={styles.heroTitle}>
              {isAuthenticated ? `Welcome back,\n${displayName} 👋` : 'One place for all\nstudent concerns'}
            </Text>
            <Text style={styles.heroSub}>
              Report issues confidently, receive meaningful updates, and track resolutions
              with a clear student workflow.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.heroCTA, { opacity: ctaO, transform: [{ translateY: ctaY }] }]}>
            {isAuthenticated ? (
              <View style={styles.signedInPill}>
                <View style={styles.signedInDot} />
                <Text style={styles.signedInTxt}>
                  You're signed in — open your dashboard from navigation
                </Text>
              </View>
            ) : (
              <View style={styles.ctaRow}>
                <Animated.View style={{ flex: 1, transform: [{ scale: registerScale }] }}>
                  <TouchableOpacity
                    style={styles.ctaPrimary}
                    onPress={() => navigation.navigate('Register')}
                    onPressIn={() => pressIn(registerScale)}
                    onPressOut={() => pressOut(registerScale)}
                    activeOpacity={1}
                  >
                    <LinearGradient colors={['#e53935', '#b71c1c']} style={styles.ctaGrad}>
                      <Ionicons name="person-add-outline" size={16} color="#fff" />
                      <Text style={styles.ctaPrimaryTxt}>Create Account</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
                <Animated.View style={{ flex: 1, transform: [{ scale: loginScale }] }}>
                  <TouchableOpacity
                    style={styles.ctaSecondary}
                    onPress={() => navigation.navigate('Login')}
                    onPressIn={() => pressIn(loginScale)}
                    onPressOut={() => pressOut(loginScale)}
                    activeOpacity={1}
                  >
                    <Ionicons name="log-in-outline" size={16} color="#e53935" />
                    <Text style={styles.ctaSecondaryTxt}>Sign In</Text>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            )}
          </Animated.View>
        </View>

        {/* ── STATS ── */}
        <View style={styles.statsRow}>
          {[
            { val: '24h', lbl: 'Response\nTarget' },
            { val: '100%', lbl: 'Fully\nConfidential' },
            { val: '1', lbl: 'Unified\nPortal' },
          ].map((s, i) => (
            <LinearGradient key={i} colors={['#ffffff', '#f8f9fa']} style={styles.statCard}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* ── FEATURES ── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Why students choose us</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featureScroll}
          decelerationRate="fast"
          snapToInterval={202}
        >
          {featureList.map((item, index) => (
            <FeatureCard key={item.id} item={item} index={index} />
          ))}
        </ScrollView>

        {/* ── HOW IT WORKS ── */}
        <View style={styles.sectionHead}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>How it works</Text>
        </View>

        <View style={styles.stepsContainer}>
          {processSteps.map((item, index) => (
            <StepRow
              key={item.id}
              item={item}
              index={index}
              isActive={activeStep === item.id}
              onPress={() => setActiveStep(activeStep === item.id ? null : item.id)}
            />
          ))}
        </View>

        {/* ── FOOTER ── */}
        <LinearGradient colors={['#1f2937', '#111827']} style={styles.footer}>
          <View style={styles.footerMain}>
            <View style={styles.footerTop}>
              <Image source={brandLogo} style={styles.footerLogo} resizeMode="cover" />
              <View>
                <Text style={styles.footerBrand}>Knowledge Bridge</Text>
                <Text style={styles.footerTagline}>Student Concern Management</Text>
              </View>
            </View>

            <View style={styles.footerContacts}>
              <View style={styles.footerRow}>
                <Ionicons name="mail" size={12} color="#e53935" />
                <Text style={styles.footerTxt}>admin@akbinstitute.edu.lk</Text>
              </View>
              <View style={styles.footerRow}>
                <Ionicons name="call" size={12} color="#e53935" />
                <Text style={styles.footerTxt}>0717514859</Text>
              </View>
            </View>
          </View>
          <Text style={styles.footerCopy}>© AKB Creative Solution</Text>
        </LinearGradient>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────
   STYLES
───────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fffcfc' },
  scroll: { flexGrow: 1, backgroundColor: '#fffcfc' },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  topBadgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e53935' },
  topBadgeText: { color: '#4b5563', fontSize: 11, fontWeight: '700', letterSpacing: 0.4 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#e53935',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: 'rgba(229,57,53,0.07)',
  },
  loginTxt: { color: '#e53935', fontSize: 12, fontWeight: '800' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#e53935',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutTxt: { color: '#fff', fontSize: 12, fontWeight: '800' },

  /* Hero section */
  heroSection: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },

  /* Hero logo rings */
  heroLogoWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(229,57,53,0.15)',
  },
  ring1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.25)',
    borderStyle: 'dashed',
  },
  ring2: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.06)',
    borderStyle: 'dotted',
  },
  ring3: {
    position: 'absolute',
    width: 142,
    height: 142,
    borderRadius: 71,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.18)',
  },
  heroImgContainer: {
    width: 124,
    height: 124,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  heroImg: { width: '100%', height: '100%' },
  heroShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 55,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ skewX: '-20deg' }],
  },
  liveDot: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  orbitDot1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  orbitDot2: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orbitDotRed: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#e53935', marginTop: -4 },
  orbitDotWhite: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },

  /* Hero text */
  heroTitleBlock: { alignItems: 'center', marginBottom: 22 },
  heroAcademy: {
    color: '#e53935',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 10,
  },
  heroTitle: {
    color: '#1f2937',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.6,
    marginBottom: 12,
  },
  heroSub: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
    maxWidth: 300,
  },

  /* CTA buttons */
  heroCTA: { width: '100%' },
  ctaRow: { flexDirection: 'row', gap: 10 },
  ctaPrimary: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#e53935',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 7,
  },
  ctaPrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '900' },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    gap: 7,
  },
  ctaSecondaryTxt: { color: '#e53935', fontSize: 14, fontWeight: '800' },
  signedInPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  signedInDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#10b981' },
  signedInTxt: { color: '#4b5563', fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 17 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 28 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  statVal: { color: '#e53935', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  statLbl: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  /* Section heading */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#e53935', marginRight: 10 },
  sectionLabel: { color: '#1f2937', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },

  /* Feature cards */
  featureScroll: { paddingHorizontal: 20, paddingBottom: 8, gap: 12, marginBottom: 28 },
  featureCard: {
    width: 190,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 18,
    backgroundColor: '#ffffff',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(229,57,53,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.2)',
  },
  featureCardTitle: { color: '#1f2937', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  featureCardText: { color: '#6b7280', fontSize: 12, lineHeight: 18, fontWeight: '400', flex: 1 },
  featureCardFoot: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 16 },
  featureCardLearn: { color: '#e53935', fontSize: 11, fontWeight: '800' },

  /* Steps accordion */
  stepsContainer: { paddingHorizontal: 20, gap: 8, marginBottom: 28 },
  stepCard: { borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', overflow: 'hidden', backgroundColor: '#ffffff' },
  stepCardHead: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  stepNum: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#9ca3af', fontSize: 13, fontWeight: '900' },
  stepInfo: { flex: 1 },
  stepIconRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepTitle: { color: '#4b5563', fontSize: 13, fontWeight: '700' },
  stepTitleActive: { color: '#1f2937', fontWeight: '900' },
  stepBodyText: { color: '#6b7280', fontSize: 12, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 14 },

  /* Footer */
  footer: {
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    overflow: 'hidden',
  },
  footerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerLogo: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  footerBrand: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  footerTagline: { color: '#9ca3af', fontSize: 9, fontWeight: '600' },
  footerContacts: { gap: 4 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerTxt: { color: '#9ca3af', fontSize: 10, fontWeight: '600' },
  footerCopy: { color: '#4b5563', fontSize: 9, fontWeight: '600', marginTop: 8, textAlign: 'center' },
});