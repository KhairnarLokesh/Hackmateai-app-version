import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Link as LinkIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function JoinProjectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  
  const [projectId, setProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const targetTeamId = teamId || 'DEMO_TEAM';

  const handleJoin = async () => {
    if (!projectId.trim()) {
      setError('Please enter a Project ID.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const cleanId = projectId.trim();
      const projectRef = doc(db, 'teams', targetTeamId, 'projects', cleanId);
      const projectDoc = await getDoc(projectRef);

      if (projectDoc.exists()) {
        router.replace(`/project/${cleanId}`);
      } else {
        setError('Project not found. Please check the ID and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while joining the project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.content, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join Project</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.inputSection}>
          <BlurView intensity={20} tint="dark" style={styles.card}>
            <View style={styles.iconContainer}>
              <LinkIcon size={24} color="#38bdf8" />
            </View>
            <Text style={styles.title}>Enter Project ID</Text>
            <Text style={styles.subtitle}>
              Ask your team members for the specific Project ID to access its Kanban board.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="e.g. 7f8a9b..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={projectId}
              onChangeText={setProjectId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={styles.joinButton}
              onPress={handleJoin}
              disabled={loading}
            >
              <LinearGradient
                colors={['#0ea5e9', '#0284c7']}
                style={styles.joinButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <LinkIcon size={18} color="#fff" />
                    <Text style={styles.joinButtonText}>Join Project</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  inputSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 100, // adjust for keyboard
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: 24,
  },
  joinButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
