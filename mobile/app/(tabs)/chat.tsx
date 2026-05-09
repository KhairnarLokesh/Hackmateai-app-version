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
import { Send, Bot, User as UserIcon, MessageSquare } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '@/lib/firebase';
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

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { teamId } = useAuth();
  const targetTeamId = teamId || 'DEMO_TEAM';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const messagesRef = collection(db, 'teams', targetTeamId, 'messages');
    
    const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
      const fetchedMessages = snapshot.docs.map(doc => ({
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
  }, [targetTeamId]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    const textToSend = inputText.trim();
    setInputText(''); // Clear immediately for snappy UI
    
    const isAiQuery = textToSend.toLowerCase().startsWith('@ai') || textToSend.toLowerCase().startsWith('@mentor');
    
    try {
      const messagesRef = collection(db, 'teams', targetTeamId, 'messages');
      
      // 1. Save user's message
      await addDoc(messagesRef, {
        text: textToSend,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || 'anonymous',
        isAiMentor: false,
      });

      // 2. If it's an AI query, ask the mentor
      if (isAiQuery) {
        setIsAiTyping(true);
        // Remove the trigger word from the prompt
        const cleanQuery = textToSend.replace(/^@(ai|mentor)\s*/i, '');
        
        const aiResponse = await askAiMentor(cleanQuery);
        
        // 3. Save AI's response
        await addDoc(messagesRef, {
          text: aiResponse,
          createdAt: new Date().toISOString(),
          userId: 'ai_mentor',
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
    const isMe = item.userId === (auth.currentUser?.uid || 'anonymous');
    const isAi = item.isAiMentor;

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <LinearGradient
        colors={['#0f172a', '#1e1b4b', '#064e3b']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
        <View style={styles.headerTitleRow}>
          <MessageSquare size={24} color="#fff" />
          <Text style={styles.headerTitle}>Team Chat</Text>
        </View>
        <Text style={styles.headerSubtitle}>Tag @ai or @mentor for help</Text>
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
        />
      )}

      {isAiTyping && (
        <View style={styles.typingIndicator}>
          <Bot size={16} color="#d8b4fe" style={{ marginRight: 8 }} />
          <Text style={styles.typingText}>AI Mentor is thinking...</Text>
        </View>
      )}

      <BlurView intensity={40} tint="dark" style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 100) }]}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message or @ai..."
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
