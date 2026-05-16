import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Send, Bot, User as UserIcon, MessageSquare, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '@/lib/firebase';
// @ts-ignore - Firebase v12 types don't resolve correctly in React Native module system
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { askAiMentor } from '@/lib/ai-service';

interface Message {
  id: string;
  text: string;
  createdAt: string;
  userId: string;
  isAiMentor: boolean;
}

type ChatMode = 'team' | 'mentor';

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  const targetTeamId = teamId || 'DEMO_TEAM';

  const [activeMode, setActiveMode] = useState<ChatMode>('team');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setLoading(true);
    let messagesRef;
    
    if (activeMode === 'team') {
      messagesRef = collection(db, 'teams', targetTeamId, 'messages');
    } else {
      const uid = auth.currentUser?.uid || 'anonymous';
      messagesRef = collection(db, 'users', uid, 'mentor_messages');
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = onSnapshot(messagesRef, (snapshot: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchedMessages = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Sort by creation date (oldest first for chat display)
      fetchedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      setMessages(fetchedMessages);
      setLoading(false);
      
      // Auto-scroll to bottom on new messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    return () => unsubscribe();
  }, [activeMode, targetTeamId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText(''); // Clear immediately for snappy UI
    
    try {
      if (activeMode === 'team') {
        const messagesRef = collection(db, 'teams', targetTeamId, 'messages');
        
        // Save user's message to team chat
        await addDoc(messagesRef, {
          text: textToSend,
          createdAt: new Date().toISOString(),
          userId: auth.currentUser?.uid || 'anonymous',
          isAiMentor: false,
        });
        
      } else {
        // Mentor Mode
        const uid = auth.currentUser?.uid || 'anonymous';
        const messagesRef = collection(db, 'users', uid, 'mentor_messages');
        
        // 1. Save user's message to mentor chat
        await addDoc(messagesRef, {
          text: textToSend,
          createdAt: new Date().toISOString(),
          userId: uid,
          isAiMentor: false,
        });

        setIsAiTyping(true);
        
        // 2. Ask the mentor
        const aiResponse = await askAiMentor(textToSend);
        
        // 3. Save AI's response
        await addDoc(messagesRef, {
          text: aiResponse,
          createdAt: new Date().toISOString(),
          userId: uid, // Use uid to prevent any strict Firestore rules from blocking
          isAiMentor: true,
        });
        setIsAiTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setIsAiTyping(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isAi = item.isAiMentor;
    const isMe = item.userId === (auth.currentUser?.uid || 'anonymous') && !isAi;

    return (
      <View style={[
        styles.messageWrapper,
        isMe ? styles.messageWrapperMe : styles.messageWrapperOther
      ]}>
        {!isMe && (
          <View style={[styles.avatar, isAi ? styles.avatarAi : styles.avatarUser]}>
            {isAi ? <Bot size={16} color="#d8b4fe" /> : <UserIcon size={16} color="#fff" />}
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMe ? styles.messageBubbleMe : (isAi ? styles.messageBubbleAi : styles.messageBubbleOther)
        ]}>
          {isAi && <Text style={styles.aiLabel}>AI Mentor</Text>}
          {!isAi && !isMe && activeMode === 'team' && (
            <Text style={styles.userLabel}>Team Member</Text>
          )}
          <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextOther]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTitleRow}>
          {activeMode === 'team' ? (
            <MessageSquare size={24} color="#fff" />
          ) : (
            <Sparkles size={24} color="#d8b4fe" />
          )}
          <Text style={styles.headerTitle}>
            {activeMode === 'team' ? 'Team Chat' : 'AI Mentor'}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {activeMode === 'team' ? 'Collaborate with your team' : 'Your private 1-on-1 AI assistant'}
        </Text>

        {/* Segmented Control */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, activeMode === 'team' && styles.activeToggle]}
            onPress={() => setActiveMode('team')}
          >
            <MessageSquare size={16} color={activeMode === 'team' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.toggleText, activeMode === 'team' && styles.activeToggleText]}>Team</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, activeMode === 'mentor' && styles.activeToggle]}
            onPress={() => setActiveMode('mentor')}
          >
            <Bot size={16} color={activeMode === 'mentor' ? '#fff' : 'rgba(255,255,255,0.5)'} />
            <Text style={[styles.toggleText, activeMode === 'mentor' && styles.activeToggleText]}>Mentor</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Bot size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyStateText}>
                {activeMode === 'team' 
                  ? 'No messages yet. Start the conversation!' 
                  : 'Hi there! I am your AI Mentor. How can I help you build today?'}
              </Text>
            </View>
          }
        />
      )}

      {isAiTyping && activeMode === 'mentor' && (
        <View style={styles.typingIndicator}>
          <Bot size={16} color="#d8b4fe" style={{ marginRight: 8 }} />
          <Text style={styles.typingText}>AI Mentor is thinking...</Text>
        </View>
      )}

      <BlurView intensity={40} tint="dark" style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={styles.textInput}
          placeholder={activeMode === 'team' ? "Type a message..." : "Ask your AI Mentor..."}
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Send size={20} color="#fff" style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </BlurView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  activeToggle: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  activeToggleText: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperMe: {
    alignSelf: 'flex-end',
  },
  messageWrapperOther: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarUser: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  avatarAi: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: '#22c55e',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  messageBubbleAi: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    borderBottomLeftRadius: 4,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#d8b4fe',
    marginBottom: 4,
  },
  userLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextMe: {
    color: '#000',
    fontWeight: '500',
  },
  messageTextOther: {
    color: '#fff',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  typingText: {
    color: 'rgba(168, 85, 247, 0.8)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    color: '#fff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 48,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#22c55e',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
  },
});
