import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Send, Bot, User as UserIcon, MessageSquare, Sparkles } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '@/lib/firebase';
// @ts-ignore
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { askAiMentor } from '@/lib/ai-service';

const C = {
  bg: '#08090E',
  surface: '#12151F',
  surfaceHigh: '#1C2030',
  accent: '#7C3AED',
  accentSoft: 'rgba(124,58,237,0.15)',
  green: '#10B981',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  textMuted: 'rgba(255,255,255,0.3)',
  border: 'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.12)',
};

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

  const [mode, setMode] = useState<ChatMode>('team');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiTyping, setAiTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    setLoading(true);
    setMessages([]);
    const ref = mode === 'team'
      ? collection(db, 'teams', targetTeamId, 'messages')
      : collection(db, 'users', auth.currentUser?.uid || 'anon', 'mentor_messages');

    const unsub = onSnapshot(ref, (snap: any) => {
      const msgs = snap.docs.map((d: any) => ({ id: d.id, ...d.data() })) as Message[];
      msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => unsub();
  }, [mode, targetTeamId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    try {
      if (mode === 'team') {
        await addDoc(collection(db, 'teams', targetTeamId, 'messages'), {
          text, createdAt: new Date().toISOString(),
          userId: auth.currentUser?.uid || 'anon', isAiMentor: false,
        });
      } else {
        const uid = auth.currentUser?.uid || 'anon';
        const ref = collection(db, 'users', uid, 'mentor_messages');
        await addDoc(ref, { text, createdAt: new Date().toISOString(), userId: uid, isAiMentor: false });
        setAiTyping(true);
        const reply = await askAiMentor(text);
        await addDoc(ref, { text: reply, createdAt: new Date().toISOString(), userId: uid, isAiMentor: true });
        setAiTyping(false);
      }
    } catch {
      setAiTyping(false);
    }
  };

  const renderMsg = ({ item }: { item: Message }) => {
    const isAi = item.isAiMentor;
    const isMe = item.userId === (auth.currentUser?.uid || 'anon') && !isAi;
    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={[styles.avatar, isAi ? styles.avatarAi : styles.avatarUser]}>
            {isAi ? <Bot size={14} color={C.accent} /> : <UserIcon size={14} color={C.textSecondary} />}
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : isAi ? styles.bubbleAi : styles.bubbleOther]}>
          {isAi && <Text style={styles.aiLabel}>AI Mentor</Text>}
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          {mode === 'team' ? <MessageSquare size={20} color={C.text} /> : <Sparkles size={20} color={C.accent} />}
          <Text style={styles.headerTitle}>{mode === 'team' ? 'Team Chat' : 'AI Mentor'}</Text>
        </View>
        {/* Toggle */}
        <View style={styles.toggle}>
          {(['team', 'mentor'] as ChatMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}
              onPress={() => setMode(m)}
            >
              {m === 'team'
                ? <MessageSquare size={14} color={mode === m ? '#fff' : C.textMuted} />
                : <Bot size={14} color={mode === m ? '#fff' : C.textMuted} />}
              <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                {m === 'team' ? 'Team' : 'Mentor'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={C.accent} /></View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={i => i.id}
          renderItem={renderMsg}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bot size={40} color={C.textMuted} />
              <Text style={styles.emptyText}>
                {mode === 'team' ? 'No messages yet. Say hello!' : 'Ask me anything about your hackathon project.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Typing indicator */}
      {aiTyping && (
        <View style={styles.typing}>
          <Bot size={14} color={C.accent} />
          <Text style={styles.typingText}>AI Mentor is thinking…</Text>
        </View>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.textInput}
          placeholder={mode === 'team' ? 'Message your team…' : 'Ask AI Mentor…'}
          placeholderTextColor={C.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnOff]}
          onPress={handleSend}
          disabled={!input.trim()}
        >
          <Send size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.4 },
  toggle: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: C.border },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  toggleBtnActive: { backgroundColor: C.accent },
  toggleText: { fontSize: 13, fontWeight: '600', color: C.textMuted },
  toggleTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 12, flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 32 },
  emptyText: { color: C.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', maxWidth: '82%', gap: 8 },
  msgRowMe: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowOther: { alignSelf: 'flex-start' },
  avatar: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  avatarUser: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  avatarAi: { backgroundColor: C.accentSoft, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  bubbleMe: { backgroundColor: C.accent, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: C.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
  bubbleAi: { backgroundColor: C.accentSoft, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  aiLabel: { fontSize: 10, fontWeight: '700', color: C.accent, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  msgText: { fontSize: 14, lineHeight: 21, color: C.text, fontWeight: '500' },
  msgTextMe: { color: '#fff' },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 8 },
  typingText: { color: C.accent, fontSize: 12, fontStyle: 'italic' },
  inputBar: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border, alignItems: 'flex-end', gap: 10, backgroundColor: C.surface },
  textInput: { flex: 1, backgroundColor: C.surfaceHigh, borderRadius: 14, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, color: C.text, fontSize: 14, borderWidth: 1, borderColor: C.border, minHeight: 44, maxHeight: 110 },
  sendBtn: { width: 44, height: 44, borderRadius: 13, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center' },
  sendBtnOff: { opacity: 0.35 },
});
