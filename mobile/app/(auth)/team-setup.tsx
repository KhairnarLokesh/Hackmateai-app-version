import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, ActivityIndicator } from 'react-native';
import { auth, db } from '@/lib/firebase';
// @ts-ignore - Firebase Firestore types issue in React Native
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function TeamSetupScreen() {
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [isCreating, setIsCreating] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, refreshTeamId } = useAuth();
  const router = useRouter();

  const generateTeamCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleAction = async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      if (isCreating) {
        if (!teamName) {
          setError('Please enter a team name');
          setLoading(false);
          return;
        }

        const newCode = generateTeamCode();
        
        // Create Team Doc
        await setDoc(doc(db, 'teams', newCode), {
          name: teamName,
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
          members: [user.uid],
        });

        // Update User Doc
        await updateDoc(doc(db, 'users', user.uid), {
          teamId: newCode,
        });

        await refreshTeamId();
        router.replace('/(tabs)');
      } else {
        if (!teamCode || teamCode.length !== 6) {
          setError('Please enter a valid 6-character team code');
          setLoading(false);
          return;
        }

        const upperCode = teamCode.toUpperCase();
        const teamRef = doc(db, 'teams', upperCode);
        const teamDoc = await getDoc(teamRef);

        if (!teamDoc.exists()) {
          setError('Team not found. Please check the code.');
          setLoading(false);
          return;
        }

        // Add user to team members list
        const teamData = teamDoc.data();
        if (!teamData.members.includes(user.uid)) {
          await updateDoc(teamRef, {
            members: [...teamData.members, user.uid],
          });
        }

        // Update user doc
        await updateDoc(doc(db, 'users', user.uid), {
          teamId: upperCode,
        });

        await refreshTeamId();
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // The onAuthStateChanged listener in _layout.tsx will automatically
      // redirect to /(auth)/login once user becomes null
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Team Setup</ThemedText>
        <ThemedText style={styles.subtitle}>
          You must join or create a team to access HackMate AI.
        </ThemedText>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, isCreating && styles.activeToggle]}
            onPress={() => setIsCreating(true)}
          >
            <Text style={[styles.toggleText, isCreating && styles.activeToggleText]}>Create Team</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, !isCreating && styles.activeToggle]}
            onPress={() => setIsCreating(false)}
          >
            <Text style={[styles.toggleText, !isCreating && styles.activeToggleText]}>Join Team</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isCreating ? (
            <TextInput
              style={styles.input}
              placeholder="Team Name (e.g. Code Ninjas)"
              placeholderTextColor="#888"
              value={teamName}
              onChangeText={setTeamName}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="6-Character Team Code"
              placeholderTextColor="#888"
              autoCapitalize="characters"
              maxLength={6}
              value={teamCode}
              onChangeText={setTeamCode}
            />
          )}

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>
                {isCreating ? 'Create & Join' : 'Join Team'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <ThemedText style={styles.logoutText}>Sign Out</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeToggle: {
    backgroundColor: '#4285F4',
  },
  toggleText: {
    color: '#888',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#fff',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
  },
  actionButton: {
    backgroundColor: '#4285F4',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    padding: 16,
  },
  logoutText: {
    color: '#ff4444',
    opacity: 0.8,
  },
});
