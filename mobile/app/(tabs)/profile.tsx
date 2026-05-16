import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import {
  User, GitBranch, Code2, LogOut, Save, CheckCircle2, Mail, Shield,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/auth-context';
import { auth, db } from '@/lib/firebase';
// @ts-ignore
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';

const C = {
  bg: '#08090E',
  surface: '#12151F',
  surfaceHigh: '#1C2030',
  accent: '#7C3AED',
  accentSoft: 'rgba(124,58,237,0.15)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.15)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.1)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.07)',
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, userProfile, refreshTeamId } = useAuth();

  // Profile fields
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [github, setGithub] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveErr, setSaveErr] = useState('');

  // Password fields
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');

  // Reset email loading
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setSkills(userProfile.skills || '');
      setGithub(userProfile.githubUsername || '');
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!name.trim()) { setSaveErr('Name is required'); return; }
    setSaving(true); setSaveErr(''); setSaveMsg('');
    try {
      await updateProfile(user!, { displayName: name.trim() });
      await updateDoc(doc(db, 'users', user!.uid), {
        displayName: name.trim(),
        skills: skills.trim() || null,
        githubUsername: github.trim() || null,
        profileCompleted: true,
        updatedAt: new Date().toISOString(),
      });
      await refreshTeamId();
      setSaveMsg('Profile updated!');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (e: any) {
      setSaveErr(e.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) { setPwErr('All fields required'); return; }
    if (newPw !== confirmPw) { setPwErr('Passwords do not match'); return; }
    if (newPw.length < 6) { setPwErr('Min 6 characters'); return; }
    setChangingPw(true); setPwErr(''); setPwMsg('');
    try {
      const credential = EmailAuthProvider.credential(user!.email!, currentPw);
      await reauthenticateWithCredential(user!, credential);
      await updatePassword(user!, newPw);
      setPwMsg('Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e: any) {
      setPwErr(e.code === 'auth/wrong-password' ? 'Current password is incorrect' : e.message);
    } finally {
      setChangingPw(false);
    }
  };

  const handleResetEmail = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Email Sent', `Password reset email sent to ${user.email}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSendingReset(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => auth.signOut() },
    ]);
  };

  const initial = (name || user?.email || 'U').charAt(0).toUpperCase();
  const isEmailUser = user?.providerData?.[0]?.providerId === 'password';

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.profileName}>{name || 'Your Profile'}</Text>
          <Text style={styles.profileEmail}>{user?.email || 'Guest'}</Text>
        </View>

        {/* ── Public Profile ── */}
        <Text style={styles.sectionLabel}>PUBLIC PROFILE</Text>
        <View style={styles.card}>
          <InputField label="Display Name" icon={<User size={16} color={C.textMuted} />}
            value={name} onChangeText={setName} placeholder="Your full name" />
          <InputField label="Skills" icon={<Code2 size={16} color={C.textMuted} />}
            value={skills} onChangeText={setSkills} placeholder="React, Python, Figma…" />
          <InputField label="GitHub Username" icon={<GitBranch size={16} color={C.textMuted} />}
            value={github} onChangeText={setGithub} placeholder="yourusername"
            autoCapitalize="none" />

          {!!saveErr && <Text style={styles.errText}>{saveErr}</Text>}
          {!!saveMsg && <View style={styles.successRow}><CheckCircle2 size={14} color={C.green} /><Text style={styles.successText}>{saveMsg}</Text></View>}

          <TouchableOpacity style={[styles.btn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" size="small" /> : <><Save size={15} color="#fff" /><Text style={styles.btnText}>Save Changes</Text></>}
          </TouchableOpacity>
        </View>

        {/* ── Security (email users only) ── */}
        {isEmailUser && (
          <>
            <Text style={styles.sectionLabel}>SECURITY</Text>
            <View style={styles.card}>
              <InputField label="Current Password" icon={<Shield size={16} color={C.textMuted} />}
                value={currentPw} onChangeText={setCurrentPw} placeholder="••••••••" secureTextEntry />
              <InputField label="New Password" icon={<Shield size={16} color={C.textMuted} />}
                value={newPw} onChangeText={setNewPw} placeholder="Min 6 characters" secureTextEntry />
              <InputField label="Confirm New Password" icon={<Shield size={16} color={C.textMuted} />}
                value={confirmPw} onChangeText={setConfirmPw} placeholder="Repeat new password" secureTextEntry />

              {!!pwErr && <Text style={styles.errText}>{pwErr}</Text>}
              {!!pwMsg && <View style={styles.successRow}><CheckCircle2 size={14} color={C.green} /><Text style={styles.successText}>{pwMsg}</Text></View>}

              <TouchableOpacity style={[styles.btn, changingPw && { opacity: 0.5 }]} onPress={handleChangePassword} disabled={changingPw}>
                {changingPw ? <ActivityIndicator color="#fff" size="small" /> : <><Shield size={15} color="#fff" /><Text style={styles.btnText}>Change Password</Text></>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} onPress={handleResetEmail} disabled={sendingReset}>
                {sendingReset ? <ActivityIndicator color={C.accent} size="small" /> : <><Mail size={15} color={C.accent} /><Text style={styles.outlineBtnText}>Send Reset Email</Text></>}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Logout ── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={16} color={C.red} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ label, icon, value, onChangeText, placeholder, secureTextEntry, autoCapitalize }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={fieldStyles.row}>
        <View style={fieldStyles.icon}>{icon}</View>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.2)"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'words'}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)', marginBottom: 7, letterSpacing: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C2030', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  icon: { paddingLeft: 14 },
  input: { flex: 1, color: '#fff', paddingVertical: 13, paddingHorizontal: 10, fontSize: 15 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  profileEmail: { fontSize: 13, color: C.textSecondary, marginTop: 3 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1, marginBottom: 10, marginTop: 20 },
  card: { backgroundColor: C.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, marginTop: 8, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', backgroundColor: C.accentSoft },
  outlineBtnText: { color: C.accent, fontWeight: '700', fontSize: 14 },
  errText: { color: C.red, fontSize: 13, marginTop: 4, marginBottom: 4 },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 },
  successText: { color: C.green, fontSize: 13, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.redSoft, borderRadius: 14, paddingVertical: 15, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)' },
  logoutText: { color: C.red, fontWeight: '700', fontSize: 15 },
});
