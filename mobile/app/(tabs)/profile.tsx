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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import {
  User,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [name, setName] = useState('Hacker');
  const [skills, setSkills] = useState('React, Node.js');
  const [github, setGithub] = useState('hacker123');

  const handleLogout = () => {
    // Navigate back to the main landing page
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#064e3b']}
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
            <View style={styles.avatarWrap}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>H</Text>
              </LinearGradient>
            </View>
            <Text style={styles.username}>Hacker</Text>
            <Text style={styles.email}>hacker@example.com</Text>
          </View>

          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Public Profile</Text>

            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Display Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>My Skills</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { paddingLeft: 16 }]}
                    value={skills}
                    onChangeText={setSkills}
                    placeholder="e.g. React, Python"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>GitHub Username</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="rgba(255,255,255,0.5)" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={github}
                    onChangeText={setGithub}
                    autoCapitalize="none"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8}>
                <User size={18} color="#000" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                <View style={styles.actionRowLeft}>
                  <View style={styles.actionIconBox}>
                    <User size={18} color="#fff" />
                  </View>
                  <Text style={styles.actionRowText}>Update Password</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              <TouchableOpacity style={styles.actionRow} activeOpacity={0.7}>
                <View style={styles.actionRowLeft}>
                  <View style={styles.actionIconBox}>
                    <User size={18} color="#fff" />
                  </View>
                  <Text style={styles.actionRowText}>Send Reset Email</Text>
                </View>
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
              <User size={20} color="#ef4444" />
              <Text style={styles.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>

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
    paddingBottom: 120, // space for tab bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 32,
    fontWeight: '800',
  },
  username: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  saveBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  actionRow: {
    paddingVertical: 12,
  },
  actionRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 4,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    gap: 8,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
