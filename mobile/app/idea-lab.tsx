import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Sparkles, FolderOpen, CheckCircle, Code } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { generateIdeaSpec, GeneratedProject } from '@/lib/ai-service';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function IdeaLabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedProject | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!idea.trim()) {
      setError('Please enter an idea.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const generated = await generateIdeaSpec(idea);
      setResult(generated);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!result) return;
    
    // For demo purposes, if teamId is null, we can save to a default path or show alert
    const targetTeamId = teamId || 'DEMO_TEAM';
    
    try {
      setLoading(true);
      const projectRef = doc(collection(db, 'teams', targetTeamId, 'projects'));
      
      await setDoc(projectRef, {
        name: result.name,
        problemStatement: result.problemStatement,
        features: result.features,
        techStack: result.techStack,
        status: 'Active',
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'anonymous',
      });
      
      router.back();
    } catch (err: any) {
      setError('Failed to save project: ' + err.message);
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

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Idea Lab</Text>
          <View style={{ width: 24 }} />
        </View>

        {!result ? (
          <View style={styles.inputSection}>
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={styles.iconContainer}>
                <Sparkles size={24} color="#d8b4fe" />
              </View>
              <Text style={styles.title}>What's your hackathon idea?</Text>
              <Text style={styles.subtitle}>
                Describe your raw idea, problem, or goal. Our AI Mentor will generate a complete technical specification for your team.
              </Text>

              <TextInput
                style={styles.textInput}
                placeholder="E.g., A mobile app that connects local farmers directly to restaurants..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={idea}
                onChangeText={setIdea}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={styles.generateButton}
                onPress={handleGenerate}
                disabled={loading}
              >
                <LinearGradient
                  colors={['#8b5cf6', '#6d28d9']}
                  style={styles.generateButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Sparkles size={18} color="#fff" />
                      <Text style={styles.generateButtonText}>Generate Spec</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </BlurView>
          </View>
        ) : (
          <View style={styles.resultSection}>
            <BlurView intensity={20} tint="dark" style={styles.resultCard}>
              <View style={styles.resultHeaderRow}>
                <FolderOpen size={24} color="#22c55e" />
                <Text style={styles.resultName}>{result.name}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Problem Statement</Text>
                <Text style={styles.sectionText}>{result.problemStatement}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <CheckCircle size={18} color="#fbbf24" />
                  <Text style={styles.sectionLabel}>Key Features</Text>
                </View>
                {result.features.map((feat, idx) => (
                  <View key={idx} style={styles.listItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.listText}>{feat}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Code size={18} color="#38bdf8" />
                  <Text style={styles.sectionLabel}>Recommended Tech Stack</Text>
                </View>
                <View style={styles.badgesContainer}>
                  {result.techStack.map((tech, idx) => (
                    <View key={idx} style={styles.techBadge}>
                      <Text style={styles.techBadgeText}>{tech}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveProject}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save to Team Project</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => setResult(null)}
                disabled={loading}
              >
                <Text style={styles.resetButtonText}>Start Over</Text>
              </TouchableOpacity>
            </BlurView>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
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
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
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
    minHeight: 120,
  },
  generateButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  generateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  resultSection: {
    flex: 1,
  },
  resultCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  resultName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
    marginTop: 8,
  },
  listText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    flex: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  techBadgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  resetButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    fontSize: 14,
  },
});
