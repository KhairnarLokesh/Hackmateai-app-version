import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import {
  ChevronLeft, Trash2, Wand2, Plus, Users, Layout, Clock,
  AlertTriangle, CheckCircle2, ChevronDown, ListTodo, Settings,
  AlignLeft, Search
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '@/lib/firebase';
// @ts-ignore
import { doc, getDoc, updateDoc, deleteDoc, collection, onSnapshot, addDoc, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { generateProblemAndTasks } from '@/lib/ai-service';

const C = {
  bg: '#08090E',
  surface: '#12151F',
  surfaceHigh: '#1C2030',
  accent: '#7C3AED',
  accentSoft: 'rgba(124,58,237,0.15)',
  green: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.15)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.07)',
};

type Tab = 'overview' | 'tasks' | 'settings';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  const targetTeamId = teamId || 'DEMO_TEAM';

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', desc: '', priority: 'Medium', effort: 'Medium', status: 'todo' });

  // AI Prompt Modal
  const [aiPromptModalVisible, setAiPromptModalVisible] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');

  // Status Action Sheet
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedTaskForStatus, setSelectedTaskForStatus] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    const projRef = doc(db, 'teams', targetTeamId, 'projects', id as string);
    const tasksRef = collection(db, 'teams', targetTeamId, 'projects', id as string, 'tasks');

    const unsubProj = onSnapshot(projRef, (docSnap: any) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    });

    const unsubTasks = onSnapshot(tasksRef, (snap: any) => {
      const list = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setTasks(list);
    });

    return () => { unsubProj(); unsubTasks(); };
  }, [id, targetTeamId]);

  const handleDeleteProject = () => {
    Alert.alert('Delete Project', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteDoc(doc(db, 'teams', targetTeamId, 'projects', id as string));
          router.replace('/(tabs)');
        } catch (e) {
          Alert.alert('Error', 'Failed to delete project');
        }
      }}
    ]);
  };

  const handleOpenAIGenerate = () => {
    setAiPromptInput(project?.name || '');
    setAiPromptModalVisible(true);
  };

  const executeAIGenerate = async () => {
    if (!aiPromptInput.trim()) return;
    setAiPromptModalVisible(false);
    setGeneratingTasks(true);
    try {
      const result = await generateProblemAndTasks(aiPromptInput.trim());
      
      // Update Project with new name and problemStatement
      const projRef = doc(db, 'teams', targetTeamId, 'projects', id as string);
      await updateDoc(projRef, {
        name: aiPromptInput.trim(),
        problemStatement: result.problemStatement,
      });

      const tasksRef = collection(db, 'teams', targetTeamId, 'projects', id as string, 'tasks');
      for (const t of result.tasks) {
        await addDoc(tasksRef, {
          title: t.title,
          description: t.description,
          status: 'todo',
          priority: t.priority,
          effort: t.effort,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser?.uid,
        });
      }
      Alert.alert('Success', `Generated problem statement and ${result.tasks.length} tasks!`);
      setActiveTab('tasks');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    try {
      await addDoc(collection(db, 'teams', targetTeamId, 'projects', id as string, 'tasks'), {
        title: newTask.title.trim(),
        description: newTask.desc.trim(),
        status: newTask.status,
        priority: newTask.priority,
        effort: newTask.effort,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid,
      });
      setTaskModalVisible(false);
      setNewTask({ title: '', desc: '', priority: 'Medium', effort: 'Medium', status: 'todo' });
    } catch (e) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const updateTaskStatus = async (status: string) => {
    if (!selectedTaskForStatus) return;
    try {
      await updateDoc(doc(db, 'teams', targetTeamId, 'projects', id as string, 'tasks', selectedTaskForStatus.id), {
        status,
        updatedAt: new Date().toISOString(),
      });
      setStatusModalVisible(false);
      setSelectedTaskForStatus(null);
    } catch (e) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={C.accent} size="large" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: C.text }}>Project not found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: C.accent }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const doingTasks = tasks.filter(t => t.status === 'doing' || t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  
  const total = tasks.length;
  const progress = total > 0 ? (doneTasks.length / total) * 100 : 0;

  const getPriorityColor = (p: string) => {
    if (p === 'Critical') return C.red;
    if (p === 'High') return C.amber;
    if (p === 'Medium') return '#3B82F6';
    return C.green;
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ChevronLeft size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['overview', 'tasks', 'settings'] as Tab[]).map((t) => (
            <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Progress</Text>
              <View style={styles.progressRow}>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
                <Text style={styles.progressSub}>{doneTasks.length} of {total} tasks done</Text>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Details</Text>
              {project.joinCode && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Join Code</Text>
                  <View style={styles.codePill}><Text style={styles.codeText}>{project.joinCode}</Text></View>
                </View>
              )}
              {project.deadline && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Deadline</Text>
                  <Text style={styles.detailValue}>{new Date(project.deadline).toLocaleDateString()}</Text>
                </View>
              )}
              {project.problemStatement && (
                <View style={[styles.detailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 6 }]}>
                  <Text style={styles.detailLabel}>Problem Statement</Text>
                  <Text style={[styles.detailValue, { lineHeight: 20 }]}>{project.problemStatement}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleOpenAIGenerate} disabled={generatingTasks}>
              <View style={[styles.actionIconBox, { backgroundColor: C.accentSoft }]}>
                <Wand2 size={20} color={C.accent} />
              </View>
              <View style={styles.actionCardText}>
                <Text style={styles.actionCardTitle}>Auto-Generate Tasks</Text>
                <Text style={styles.actionCardSub}>Use AI to break down this project into tasks.</Text>
              </View>
              {generatingTasks ? <ActivityIndicator color={C.accent} /> : <ChevronLeft size={16} color={C.textMuted} style={{ transform: [{ rotate: '180deg' }] }} />}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tasks Tab ── */}
        {activeTab === 'tasks' && (
          <View style={styles.tabContent}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskHeaderTitle}>Board</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setTaskModalVisible(true)}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Todo */}
            <View style={styles.column}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: C.textMuted }]} />
                <Text style={styles.colTitle}>To Do ({todoTasks.length})</Text>
              </View>
              {todoTasks.map(t => (
                <TaskCard key={t.id} task={t} onStatusPress={() => { setSelectedTaskForStatus(t); setStatusModalVisible(true); }} color={getPriorityColor(t.priority)} />
              ))}
            </View>

            {/* Doing */}
            <View style={styles.column}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.colTitle}>Doing ({doingTasks.length})</Text>
              </View>
              {doingTasks.map(t => (
                <TaskCard key={t.id} task={t} onStatusPress={() => { setSelectedTaskForStatus(t); setStatusModalVisible(true); }} color={getPriorityColor(t.priority)} />
              ))}
            </View>

            {/* Done */}
            <View style={styles.column}>
              <View style={styles.colHeader}>
                <View style={[styles.colDot, { backgroundColor: C.green }]} />
                <Text style={styles.colTitle}>Done ({doneTasks.length})</Text>
              </View>
              {doneTasks.map(t => (
                <TaskCard key={t.id} task={t} onStatusPress={() => { setSelectedTaskForStatus(t); setStatusModalVisible(true); }} color={getPriorityColor(t.priority)} />
              ))}
            </View>
          </View>
        )}

        {/* ── Settings Tab ── */}
        {activeTab === 'settings' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Danger Zone</Text>
              <Text style={styles.cardDesc}>Permanently delete this project and all its tasks, files, and chat history.</Text>
              
              <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteProject}>
                <Trash2 size={16} color={C.red} />
                <Text style={styles.dangerBtnText}>Delete Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── New Task Modal ── */}
      <Modal visible={taskModalVisible} transparent animationType="slide" onRequestClose={() => setTaskModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setTaskModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Task</Text>

            <Text style={styles.label}>Title</Text>
            <TextInput style={styles.input} value={newTask.title} onChangeText={t => setNewTask({...newTask, title: t})} placeholder="Task name..." placeholderTextColor={C.textMuted} />

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={newTask.desc} onChangeText={t => setNewTask({...newTask, desc: t})} placeholder="Details..." placeholderTextColor={C.textMuted} multiline />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Priority</Text>
                <View style={styles.chips}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <TouchableOpacity key={p} style={[styles.chip, newTask.priority === p && { borderColor: C.accent, backgroundColor: C.accentSoft }]} onPress={() => setNewTask({...newTask, priority: p})}>
                      <Text style={[styles.chipText, newTask.priority === p && { color: C.accent }]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateTask}>
              <Text style={styles.primaryBtnText}>Create Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Status Change Modal ── */}
      <Modal visible={statusModalVisible} transparent animationType="fade" onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setStatusModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.modalTitle}>Move Task to...</Text>
            
            <TouchableOpacity style={styles.statusOption} onPress={() => updateTaskStatus('todo')}>
              <View style={[styles.colDot, { backgroundColor: C.textMuted, marginRight: 10 }]} />
              <Text style={styles.statusOptionText}>To Do</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statusOption} onPress={() => updateTaskStatus('doing')}>
              <View style={[styles.colDot, { backgroundColor: '#3B82F6', marginRight: 10 }]} />
              <Text style={styles.statusOptionText}>Doing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statusOption} onPress={() => updateTaskStatus('done')}>
              <View style={[styles.colDot, { backgroundColor: C.green, marginRight: 10 }]} />
              <Text style={styles.statusOptionText}>Done</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: C.surfaceHigh, marginTop: 16 }]} onPress={() => setStatusModalVisible(false)}>
              <Text style={[styles.primaryBtnText, { color: C.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── AI Prompt Modal ── */}
      <Modal visible={aiPromptModalVisible} transparent animationType="slide" onRequestClose={() => setAiPromptModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setAiPromptModalVisible(false)} />
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Auto-Generate Tasks</Text>
            
            <Text style={styles.cardDesc}>Enter your project name or a brief idea. The AI will generate a problem statement and automatically create tasks.</Text>

            <Text style={styles.label}>Project Name / Idea</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
              value={aiPromptInput} 
              onChangeText={setAiPromptInput} 
              placeholder="e.g. A social app for dog walkers..." 
              placeholderTextColor={C.textMuted} 
              multiline 
            />

            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 8 }]} onPress={executeAIGenerate}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Wand2 size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>Generate with AI</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>


    </View>
  );
}

// Sub-component for Task Card
const TaskCard = ({ task, onStatusPress, color }: any) => (
  <TouchableOpacity style={styles.taskCard} onPress={onStatusPress} activeOpacity={0.7}>
    <View style={styles.taskCardHeader}>
      <Text style={styles.taskCardTitle}>{task.title}</Text>
      <View style={[styles.priorityPill, { backgroundColor: color + '20', borderColor: color + '40' }]}>
        <Text style={[styles.priorityText, { color }]}>{task.priority || 'Medium'}</Text>
      </View>
    </View>
    {!!task.description && <Text style={styles.taskCardDesc} numberOfLines={2}>{task.description}</Text>}
    <View style={styles.taskCardFooter}>
      <View style={styles.taskMeta}><AlignLeft size={12} color={C.textMuted} /><Text style={styles.taskMetaText}>Desc</Text></View>
      <View style={styles.avatarMini}><Text style={styles.avatarMiniText}>?</Text></View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
  iconBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: C.text, flex: 1, textAlign: 'center' },
  backBtn: { marginTop: 20, padding: 10 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 20 },
  tab: { paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: C.accent },
  tabText: { fontSize: 14, fontWeight: '600', color: C.textMuted },
  tabTextActive: { color: C.accent },
  scroll: { padding: 20 },
  tabContent: { gap: 16 },
  card: { backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  cardTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12 },
  cardDesc: { fontSize: 14, color: C.textSecondary, marginBottom: 16, lineHeight: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 12 },
  progressText: { fontSize: 32, fontWeight: '800', color: C.text, letterSpacing: -1 },
  progressSub: { fontSize: 13, color: C.textMuted, marginBottom: 6, fontWeight: '500' },
  progressBarBg: { height: 8, backgroundColor: C.surfaceHigh, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: C.green, borderRadius: 4 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border },
  detailLabel: { fontSize: 14, color: C.textSecondary },
  detailValue: { fontSize: 14, color: C.text, fontWeight: '500' },
  codePill: { backgroundColor: C.accentSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  codeText: { color: C.accent, fontWeight: '700', fontSize: 12, letterSpacing: 1 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.border },
  actionIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  actionCardText: { flex: 1 },
  actionCardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
  actionCardSub: { fontSize: 13, color: C.textSecondary },
  dangerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.redSoft, paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  dangerBtnText: { color: C.red, fontWeight: '700', fontSize: 14 },
  
  // Tasks
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  taskHeaderTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  column: { marginBottom: 20 },
  colHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  colDot: { width: 8, height: 8, borderRadius: 4 },
  colTitle: { fontSize: 14, fontWeight: '700', color: C.textSecondary },
  taskCard: { backgroundColor: C.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  taskCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  taskCardTitle: { fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginRight: 10 },
  priorityPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1 },
  priorityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  taskCardDesc: { fontSize: 13, color: C.textSecondary, marginBottom: 12, lineHeight: 18 },
  taskCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  taskMetaText: { fontSize: 12, color: C.textMuted },
  avatarMini: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  avatarMiniText: { fontSize: 10, color: C.textMuted, fontWeight: '700' },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, alignSelf: 'center', marginBottom: 20, marginTop: -10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: C.textSecondary, marginBottom: 8 },
  input: { backgroundColor: C.surfaceHigh, borderRadius: 12, borderWidth: 1, borderColor: C.border, color: C.text, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: C.surfaceHigh, borderWidth: 1, borderColor: C.border },
  chipText: { fontSize: 13, color: C.textSecondary, fontWeight: '500' },
  primaryBtn: { backgroundColor: C.accent, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  
  statusOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  statusOptionText: { fontSize: 16, color: C.text, fontWeight: '500' },
});
