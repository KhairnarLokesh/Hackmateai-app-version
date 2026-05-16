import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Plus,
  Link as LinkIcon,
  FolderOpen,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { auth, db } from '@/lib/firebase';
// @ts-ignore - Firebase Firestore types issue in React Native
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { teamId, userProfile } = useAuth();
  
  const [projects, setProjects] = useState<any[]>([]);
  const targetTeamId = teamId || 'DEMO_TEAM';

  const getUserInitial = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName.split(' ')[0]; // First name only
    }
    return 'User';
  };

  React.useEffect(() => {
    const projectsRef = collection(db, 'teams', targetTeamId, 'projects');
    const unsubscribe = onSnapshot(projectsRef, (snapshot) => {
      const fetchedProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Sort by newest first based on createdAt
      fetchedProjects.sort((a: any, b: any) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      setProjects(fetchedProjects);
    });

    return () => unsubscribe();
  }, [targetTeamId]);

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{getUserName()}!</Text>
          </View>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarText}>{getUserInitial()}</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/idea-lab')}
          >
            <BlurView intensity={30} tint="dark" style={styles.actionBtnBlur}>
              <View style={[styles.actionBtnIcon, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <Plus size={18} color="#22c55e" />
              </View>
              <Text style={styles.actionBtnText}>Create Project</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/join-project')}
          >
            <BlurView intensity={30} tint="dark" style={styles.actionBtnBlur}>
              <View style={[styles.actionBtnIcon, { backgroundColor: 'rgba(168, 85, 247, 0.2)' }]}>
                <LinkIcon size={18} color="#d8b4fe" />
              </View>
              <Text style={styles.actionBtnText}>Join Project</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* AI Insight Banner */}
        <BlurView intensity={40} tint="dark" style={styles.insightBanner}>
          <Sparkles size={20} color="#fbbf24" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.insightTitle}>AI Mentor Tip</Text>
            <Text style={styles.insightText}>Focus on polishing your demo. EcoTrack deadline is approaching!</Text>
          </View>
        </BlurView>

        {/* Projects List */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Projects</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {projects.length > 0 ? (
          <View style={styles.projectsList}>
            {projects.map((project) => (
              <TouchableOpacity 
                key={project.id} 
                activeOpacity={0.8}
                onPress={() => router.push(`/project/${project.id}`)}
              >
                <BlurView intensity={20} tint="dark" style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectNameRow}>
                      <FolderOpen size={20} color="#fff" />
                      <Text style={styles.projectName}>{project.name}</Text>
                    </View>
                    <View style={[
                      styles.badge, 
                      project.status === 'Demo Mode' ? styles.badgeDemo : styles.badgeActive
                    ]}>
                      <Text style={styles.badgeText}>{project.status || 'Active'}</Text>
                    </View>
                  </View>

                  <View style={styles.projectFooter}>
                    <View style={styles.footerItem}>
                      <Clock size={14} color="rgba(255,255,255,0.5)" />
                      <Text style={styles.footerText}>
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Just now'}
                      </Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Text style={styles.footerText}>
                        {project.techStack ? `${project.techStack.length} techs` : '0 techs'}
                      </Text>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <BlurView intensity={20} tint="dark" style={styles.emptyState}>
            <FolderOpen size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <Text style={styles.emptyStateTitle}>No projects yet</Text>
            <Text style={styles.emptyStateDesc}>Create your first project or join an existing one to get started.</Text>
          </BlurView>
        )}
      </ScrollView>
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
    paddingBottom: 120, // Space for tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  username: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  actionBtnBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  actionBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  insightBanner: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
    marginBottom: 32,
    overflow: 'hidden',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  projectsList: {
    paddingHorizontal: 24,
    gap: 16,
  },
  projectCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDemo: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  emptyState: {
    marginHorizontal: 24,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  emptyStateTitle: {
    fontSize: 18,
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
});
