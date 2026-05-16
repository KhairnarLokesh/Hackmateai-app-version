import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import {
  Plus, Link2, FolderOpen, Clock, Sparkles, X,
  ChevronRight, Timer, Zap, AlertTriangle, Search,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth, db } from '@/lib/firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

// ─── Design Tokens (60/30/10) ─────────────────────────────────────────────
const C = {
  bg: '#08090E',        // 60% – background
  surface: '#12151F',   // 30% – cards / inputs / modals
  surfaceHigh: '#1C2030',// elevated surface
  accent: '#7C3AED',    // 10% – primary actions
  accentSoft: 'rgba(124,58,237,0.15)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.15)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.15)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.15)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────
const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const PRESETS = [
  { label: '12h', ms: 12 * 3600000 },
  { label: '24h', ms: 24 * 3600000 },
  { label: '48h', ms: 48 * 3600000 },
  { label: '72h', ms: 72 * 3600000 },
  { label: '1 week', ms: 7 * 24 * 3600000 },
];

const getCountdown = (iso: string, now: number) => {
  const rem = new Date(iso).getTime() - now;
  if (rem <= 0) return { text: "Time's up!", color: C.red };
  const d = Math.floor(rem / 86400000);
  const h = Math.floor((rem % 86400000) / 3600000);
  const m = Math.floor((rem % 3600000) / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  const urgent = rem < 6 * 3600000;
  const text = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  return { text, color: urgent ? C.amber : C.green };
};

const getStatus = (iso?: string) => {
  if (!iso) return { label: 'Active', color: C.green, bg: C.greenSoft };
  const rem = new Date(iso).getTime() - Date.now();
  if (rem <= 0) return { label: 'Ended', color: C.red, bg: C.redSoft };
  if (rem < 6 * 3600000) return { label: 'Urgent', color: C.amber, bg: C.amberSoft };
  return { label: 'Active', color: C.green, bg: C.greenSoft };
};

// ─── Component ────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { teamId, userProfile, user } = useAuth();
  const targetTeamId = teamId || 'DEMO_TEAM';

  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  const [createVisible, setCreateVisible] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [deadlinePreset, setDeadlinePreset] = useState('48h');
  const [creating, setCreating] = useState(false);

  const [joinVisible, setJoinVisible] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setLoading(true);
    const ref = collection(db, 'teams', targetTeamId, 'projects');
    const unsub = onSnapshot(ref, (snap: any) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setProjects(list);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [targetTeamId]);

  const handleCreate = async () => {
    if (!projectName.trim()) return;
    setCreating(true);
    try {
      const presetMs = PRESETS.find(p => p.label === deadlinePreset)?.ms ?? 48 * 3600000;
      const ref = collection(db, 'teams', targetTeamId, 'projects');
      const docRef = await addDoc(ref, {
        name: projectName.trim(),
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid,
        deadline: new Date(Date.now() + presetMs).toISOString(),
        joinCode: generateJoinCode(),
        status: 'planning',
      });
      setCreateVisible(false);
      setProjectName('');
      setDeadlinePreset('48h');
      router.push(`/project/${docRef.id}` as any);
    } catch {
      Alert.alert('Error', 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setJoinError('Must be 6 characters'); return; }
    setJoining(true);
    setJoinError('');
    try {
      const q = query(collection(db, 'teams', targetTeamId, 'projects'), where('joinCode', '==', code));
      const snap = await getDocs(q);
      if (snap.empty) { setJoinError('No project found with this code'); setJoining(false); return; }
      setJoinVisible(false);
      setJoinCode('');
      router.push(`/project/${snap.docs[0].id}` as any);
    } catch {
      setJoinError('Search failed. Try again.');
    } finally {
      setJoining(false);
    }
  };

  const closeCreate = () => { setCreateVisible(false); setProjectName(''); };
  const closeJoin = () => { setJoinVisible(false); setJoinCode(''); setJoinError(''); };

  const userName = userProfile?.displayName?.split(' ')[0] || user?.displayName?.split(' ')[0] || 'Hacker';
  const userInitial = (userProfile?.displayName || user?.displayName || 'U').charAt(0).toUpperCase();
  const activeCount = projects.filter(p => p.deadline && new Date(p.deadline).getTime() > Date.now()).length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.username}>{userName} 👋</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userInitial}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: projects.length, color: C.accent },
            { label: 'Active', value: activeCount, color: C.green },
            { label: 'Ended', value: projects.length - activeCount, color: C.textMuted },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionCard, styles.actionPrimary]} activeOpacity={0.8} onPress={() => setCreateVisible(true)}>
            <View style={[styles.actionIconWrap, { backgroundColor: C.accentSoft }]}>
              <Plus size={20} color={C.accent} />
            </View>
            <Text style={styles.actionText}>Create Project</Text>
            <Text style={styles.actionSub}>Start something new</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => setJoinVisible(true)}>
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Link2 size={20} color={C.green} />
            </View>
            <Text style={styles.actionText}>Join by Code</Text>
            <Text style={styles.actionSub}>6-char team code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => router.push('/idea-lab' as any)}>
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
              <Sparkles size={20} color={C.amber} />
            </View>
            <Text style={styles.actionText}>Idea Lab</Text>
            <Text style={styles.actionSub}>AI brainstorm</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.8} onPress={() => router.push('/join-project' as any)}>
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Search size={20} color={C.red} />
            </View>
            <Text style={styles.actionText}>Find Project</Text>
            <Text style={styles.actionSub}>By project ID</Text>
          </TouchableOpacity>
        </View>

        {/* ── Projects ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Projects</Text>
          <Text style={styles.sectionCount}>{projects.length}</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={C.accent} size="large" />
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyCard}>
            <FolderOpen size={40} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No projects yet</Text>
            <Text style={styles.emptyDesc}>Create or join a project to get started</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateVisible(true)}>
              <Plus size={14} color="#fff" />
              <Text style={styles.emptyBtnText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectList}>
            {projects.map(p => {
              const status = getStatus(p.deadline);
              const countdown = p.deadline ? getCountdown(p.deadline, now) : null;
              return (
                <TouchableOpacity key={p.id} style={styles.projectCard} activeOpacity={0.8}
                  onPress={() => router.push(`/project/${p.id}` as any)}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardNameRow}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={styles.cardName} numberOfLines={1}>{p.name}</Text>
                    </View>
                    <View style={[styles.pill, { backgroundColor: status.bg }]}>
                      <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
                    </View>
                  </View>

                  {countdown && (
                    <View style={styles.countRow}>
                      <Timer size={12} color={countdown.color} />
                      <Text style={[styles.countText, { color: countdown.color }]}>{countdown.text}</Text>
                    </View>
                  )}

                  <View style={styles.cardBottom}>
                    <View style={styles.cardMeta}>
                      <Clock size={11} color={C.textMuted} />
                      <Text style={styles.metaText}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Just now'}
                      </Text>
                      {p.joinCode && (
                        <View style={styles.codeChip}>
                          <Text style={styles.codeText}>{p.joinCode}</Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={15} color={C.textMuted} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Create Modal ── */}
      <Modal visible={createVisible} transparent animationType="slide" onRequestClose={closeCreate}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeCreate} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>New Project</Text>
              <TouchableOpacity onPress={closeCreate} style={styles.closeBtn}>
                <X size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. EcoTrack AI"
              placeholderTextColor={C.textMuted}
              value={projectName}
              onChangeText={setProjectName}
              autoFocus
            />

            <Text style={styles.label}>Deadline</Text>
            <View style={styles.chipRow}>
              {PRESETS.map(p => (
                <TouchableOpacity key={p.label}
                  style={[styles.chip, deadlinePreset === p.label && styles.chipActive]}
                  onPress={() => setDeadlinePreset(p.label)}>
                  <Text style={[styles.chipText, deadlinePreset === p.label && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, (!projectName.trim() || creating) && { opacity: 0.4 }]}
              onPress={handleCreate}
              disabled={!projectName.trim() || creating}
            >
              {creating ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Zap size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Create Project</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Join Modal ── */}
      <Modal visible={joinVisible} transparent animationType="slide" onRequestClose={closeJoin}>
        <View style={styles.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeJoin} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Join Project</Text>
              <TouchableOpacity onPress={closeJoin} style={styles.closeBtn}>
                <X size={18} color={C.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetSub}>Enter the 6-character code from your team</Text>

            <TextInput
              style={styles.codeInput}
              placeholder="ABC123"
              placeholderTextColor={C.textMuted}
              value={joinCode}
              onChangeText={t => { setJoinCode(t.toUpperCase()); setJoinError(''); }}
              maxLength={6}
              autoCapitalize="characters"
              autoFocus
            />

            {!!joinError && (
              <View style={styles.errorRow}>
                <AlertTriangle size={13} color={C.red} />
                <Text style={styles.errorText}>{joinError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: C.green }, (joinCode.length !== 6 || joining) && { opacity: 0.4 }]}
              onPress={handleJoin}
              disabled={joinCode.length !== 6 || joining}
            >
              {joining ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Link2 size={16} color="#fff" />
                  <Text style={styles.primaryBtnText}>Join Project</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting: { fontSize: 13, color: C.textSecondary, marginBottom: 2 },
  username: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: C.surface, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statVal: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: C.textSecondary, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  actionCard: { width: '47.5%', backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  actionPrimary: { borderColor: 'rgba(124,58,237,0.3)' },
  actionIconWrap: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  actionText: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 2 },
  actionSub: { fontSize: 11, color: C.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  sectionCount: { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  center: { paddingVertical: 48, alignItems: 'center' },
  emptyCard: { backgroundColor: C.surface, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: C.border, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: C.text },
  emptyDesc: { fontSize: 13, color: C.textSecondary, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  projectList: { gap: 12 },
  projectCard: { backgroundColor: C.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  cardName: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1 },
  pill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '700' },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  countText: { fontSize: 13, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: C.textMuted },
  codeChip: { backgroundColor: 'rgba(124,58,237,0.15)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  codeText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1 },
  // Modals
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderColor: C.borderStrong },
  sheetHandle: { width: 36, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: C.text },
  sheetSub: { fontSize: 13, color: C.textSecondary, marginBottom: 16, marginTop: 4 },
  closeBtn: { padding: 4 },
  label: { fontSize: 12, fontWeight: '600', color: C.textSecondary, marginTop: 16, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  input: { backgroundColor: C.surfaceHigh, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, color: C.text, fontSize: 16, borderWidth: 1, borderColor: C.border },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border },
  chipActive: { borderColor: C.accent, backgroundColor: C.accentSoft },
  chipText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  chipTextActive: { color: C.accent },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 15, marginTop: 20 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  codeInput: { backgroundColor: C.surfaceHigh, borderRadius: 14, paddingVertical: 16, textAlign: 'center', color: C.text, fontSize: 26, fontWeight: '800', letterSpacing: 8, borderWidth: 1, borderColor: C.border },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  errorText: { color: C.red, fontSize: 13 },
});

// expose tokens for other screens
export { C as THEME };
