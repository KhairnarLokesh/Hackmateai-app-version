import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Plus, MoreVertical, LayoutList } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, onSnapshot, addDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

type TaskStatus = 'To-Do' | 'In Progress' | 'Done';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
}

export default function KanbanBoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  
  const targetTeamId = teamId || 'DEMO_TEAM';

  const [project, setProject] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [activeStatus, setActiveStatus] = useState<TaskStatus>('To-Do');
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Fetch Project Details
    const projectRef = doc(db, 'teams', targetTeamId, 'projects', id);
    getDoc(projectRef).then((docSnap) => {
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
    });

    // Listen for Tasks
    const tasksRef = collection(db, 'teams', targetTeamId, 'projects', id, 'tasks');
    const unsubscribe = onSnapshot(tasksRef, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      
      // Sort by creation date
      fetchedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setTasks(fetchedTasks);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, targetTeamId]);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !id) return;
    
    try {
      const tasksRef = collection(db, 'teams', targetTeamId, 'projects', id, 'tasks');
      await addDoc(tasksRef, {
        title: newTaskTitle.trim(),
        status: activeStatus,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || 'anonymous',
      });
      setNewTaskTitle('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleMoveTask = async (taskId: string, newStatus: TaskStatus) => {
    if (!id) return;
    try {
      const taskRef = doc(db, 'teams', targetTeamId, 'projects', id, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
      setSelectedTask(null); // Close the bottom sheet logic
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const currentColumnTasks = tasks.filter(t => t.status === activeStatus);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {project?.name || 'Project Board'}
          </Text>
          {id && (
            <View style={styles.codeBadge}>
              <Text style={styles.codeBadgeText}>Code: {id}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(['To-Do', 'In Progress', 'Done'] as TaskStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.tab, activeStatus === status && styles.activeTab]}
            onPress={() => {
              setActiveStatus(status);
              setSelectedTask(null);
            }}
          >
            <Text style={[styles.tabText, activeStatus === status && styles.activeTabText]}>
              {status}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{tasks.filter(t => t.status === status).length}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.boardContent}
          showsVerticalScrollIndicator={false}
        >
          {currentColumnTasks.length === 0 ? (
            <BlurView intensity={20} tint="dark" style={styles.emptyState}>
              <LayoutList size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyStateTitle}>No {activeStatus} tasks</Text>
              <Text style={styles.emptyStateDesc}>Add a new task to this column to get started.</Text>
            </BlurView>
          ) : (
            currentColumnTasks.map(task => (
              <TouchableOpacity
                key={task.id}
                onPress={() => setSelectedTask(task.id === selectedTask?.id ? null : task)}
              >
                <BlurView 
                  intensity={selectedTask?.id === task.id ? 40 : 20} 
                  tint="dark" 
                  style={[
                    styles.taskCard,
                    selectedTask?.id === task.id && styles.taskCardSelected
                  ]}
                >
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  
                  {selectedTask?.id === task.id && (
                    <View style={styles.actionRow}>
                      <Text style={styles.actionLabel}>Move to:</Text>
                      <View style={styles.actionButtons}>
                        {(['To-Do', 'In Progress', 'Done'] as TaskStatus[]).map(status => (
                          status !== task.status && (
                            <TouchableOpacity 
                              key={status}
                              style={styles.moveButton}
                              onPress={() => handleMoveTask(task.id, status)}
                            >
                              <Text style={styles.moveButtonText}>{status}</Text>
                            </TouchableOpacity>
                          )
                        ))}
                      </View>
                    </View>
                  )}
                </BlurView>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Task Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.bottom + 60}
      >
        <BlurView intensity={40} tint="dark" style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TextInput
            style={styles.textInput}
            placeholder={`Add a new ${activeStatus} task...`}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
          />
          <TouchableOpacity 
            style={[styles.addButton, !newTaskTitle.trim() && styles.addButtonDisabled]}
            onPress={handleAddTask}
            disabled={!newTaskTitle.trim()}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  codeBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  codeBadgeText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeTabText: {
    color: '#22c55e',
  },
  countBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  boardContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  emptyState: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginTop: 20,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
  },
  taskCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  taskCardSelected: {
    borderColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  taskTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    lineHeight: 22,
  },
  actionRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  moveButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  moveButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  addButton: {
    backgroundColor: '#22c55e',
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
});
