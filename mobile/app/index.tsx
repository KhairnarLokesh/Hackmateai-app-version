import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Rocket,
  Brain,
  ListTodo,
  Users,
  MessageSquare,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
// @ts-ignore - Firebase Firestore types issue in React Native
import { doc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Analysis', desc: 'Transform raw ideas into structured plans.' },
  { icon: ListTodo, title: 'Smart Tasks', desc: 'Auto-generate actionable tasks.' },
  { icon: Users, title: 'Live Collab', desc: 'Real-time sync and task assignments.' },
  { icon: MessageSquare, title: 'AI Mentor', desc: 'Instant guidance and debugging.' },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (activeTab === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // Auth state listener in _layout will handle navigation
      } else {
        // Sign Up
        if (!name.trim()) {
          setError('Please enter your name.');
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          displayName: name.trim(),
          createdAt: new Date().toISOString(),
          teamId: null,
          profileCompleted: false,
          skills: null,
          githubUsername: null,
        });
        // Auth state listener in _layout will handle navigation to profile-setup
      }
    } catch (err: any) {
      const msg = err.message || 'Authentication failed.';
      // Make Firebase errors more user-friendly
      if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) {
        setError('Invalid email or password. Please try again.');
      } else if (msg.includes('email-already-in-use')) {
        setError('An account with this email already exists. Please log in.');
      } else if (msg.includes('weak-password')) {
        setError('Password should be at least 6 characters.');
      } else if (msg.includes('invalid-email')) {
        setError('Please enter a valid email address.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInAnonymously(auth);
      // Auth state listener in _layout will handle navigation
    } catch (err: any) {
      setError('Guest login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Full Screen Gradient Background */}
      <LinearGradient
        colors={['#0f172a', '#2e1065', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <BlurView intensity={20} tint="light" style={styles.logoBlur}>
              <Rocket size={24} color="#22c55e" />
            </BlurView>
            <Text style={styles.brandText}>HackMate</Text>
          </View>

          {/* Hero Typography */}
          <View style={styles.heroSection}>
            <View style={styles.badge}>
              <Sparkles size={14} color="#a855f7" />
              <Text style={styles.badgeText}>Powered by Gemini AI</Text>
            </View>
            <Text style={styles.heroTitle}>From Idea to Execution.</Text>
            <Text style={styles.heroSubtitle}>
              The ultimate AI-driven collaboration space for hackathon teams.
            </Text>
          </View>

          {/* Horizontal Feature Carousel */}
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            snapToInterval={width * 0.7 + 16}
            decelerationRate="fast"
          >
            {FEATURES.map((feat, idx) => (
              <BlurView key={idx} intensity={40} tint="dark" style={styles.featureCard}>
                <View style={styles.featureIconWrap}>
                  <feat.icon size={24} color="#22c55e" />
                </View>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </BlurView>
            ))}
          </ScrollView>

          <View style={{ height: 40 }} />
          
          {/* Floating Glass Auth Card */}
          <View style={styles.authContainerWrapper}>
            <BlurView intensity={50} tint="dark" style={styles.authCard}>
              
              <View style={styles.authTabs}>
                <TouchableOpacity 
                  style={[styles.authTab, activeTab === 'login' && styles.authTabActive]}
                  onPress={() => { setActiveTab('login'); setError(''); }}
                >
                  <Text style={[styles.authTabText, activeTab === 'login' && styles.authTabTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.authTab, activeTab === 'signup' && styles.authTabActive]}
                  onPress={() => { setActiveTab('signup'); setError(''); }}
                >
                  <Text style={[styles.authTabText, activeTab === 'signup' && styles.authTabTextActive]}>Sign Up</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              {activeTab === 'signup' && (
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Your Name"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity style={styles.primaryBtn} onPress={handleAuth} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {activeTab === 'login' ? 'Continue' : 'Create Account'}
                    </Text>
                    <ArrowRight size={18} color="#000" />
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} onPress={handleGuestLogin} disabled={loading}>
                  <Zap size={14} color="#fbbf24" />
                  <Text style={styles.socialBtnText}>Guest Mode</Text>
                </TouchableOpacity>
              </View>
              
            </BlurView>
          </View>
          
          <View style={{ height: Math.max(insets.bottom, 20) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 40,
    gap: 12,
  },
  logoBlur: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  brandText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  badgeText: {
    color: '#d8b4fe',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 52,
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
  },
  carouselContent: {
    paddingHorizontal: 24,
    gap: 16,
    paddingBottom: 20,
  },
  featureCard: {
    width: width * 0.7,
    padding: 24,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    lineHeight: 20,
  },
  authContainerWrapper: {
    paddingHorizontal: 16,
    marginTop: 'auto',
  },
  authCard: {
    padding: 24,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  authTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  authTabActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  authTabText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: 14,
  },
  authTabTextActive: {
    color: '#fff',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 13,
  },
  inputWrapper: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    minHeight: 54,
  },
  primaryBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'center',
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  socialBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
