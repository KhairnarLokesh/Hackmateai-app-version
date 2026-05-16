import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { auth, db } from '@/lib/firebase';
// @ts-ignore - Firebase Firestore types issue in React Native
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';

export default function ProfileSetupScreen() {
  const [displayName, setDisplayName] = useState('');
  const [skills, setSkills] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { refreshTeamId } = useAuth();

  const handleComplete = async () => {
    if (!displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No user logged in');
        return;
      }

      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        skills: skills.trim() || null,
        githubUsername: githubUsername.trim() || null,
        profileCompleted: true,
        updatedAt: new Date().toISOString(),
      });

      // Refresh auth context so _layout picks up profileCompleted: true
      await refreshTeamId();

      // Navigate to team setup
      router.replace('/(auth)/team-setup');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // IMPORTANT: Skip must also mark profileCompleted: true, otherwise the
  // auth guard in _layout.tsx will loop back to profile-setup indefinitely.
  const handleSkip = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          profileCompleted: true,
          updatedAt: new Date().toISOString(),
        });
        await refreshTeamId();
      }
    } catch (err) {
      console.warn('Skip profile setup warning:', err);
    } finally {
      setLoading(false);
      router.replace('/(auth)/team-setup');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Let your team know who you are
            </Text>
          </View>

          <View style={styles.formContainer}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. John Doe"
                placeholderTextColor="#888"
                value={displayName}
                onChangeText={setDisplayName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Skills (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. React, Python, UI/UX"
                placeholderTextColor="#888"
                value={skills}
                onChangeText={setSkills}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>GitHub Username (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. johndoe"
                placeholderTextColor="#888"
                value={githubUsername}
                onChangeText={setGithubUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, !displayName.trim() && styles.buttonDisabled]} 
              onPress={handleComplete}
              disabled={loading || !displayName.trim()}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleSkip} 
              style={styles.skipButton}
              disabled={loading}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    color: '#fff',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(66, 133, 244, 0.5)',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  skipText: {
    opacity: 0.6,
    fontSize: 14,
    color: '#fff',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
