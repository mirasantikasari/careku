import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from '../navigation/AppNavigator';
import ScreenHeader from '../ui/ScreenHeader';
import { Sparkle } from 'lucide-react-native';
import { fetchRagAnswer } from '../services/ragClient';
import Markdown from 'react-native-markdown-display';

export type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Chat'>,
  NativeStackScreenProps<RootStackParamList>
>;

const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      text: 'Hai! Aku CAREKU AI. Aku pakai RAG gratis untuk cari jawaban singkat dari sumber kesehatan ringan. Tanyakan apa pun, ya!',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const quickQuestions = [
    'Boleh makan coklat?',
    'Olahraga apa yang aman?',
    'Cara kurangi nyeri?',
    'Menu diet sehat?',
  ];

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isSending) return;

    setIsSending(true);

    const placeholderId = `ai-${Date.now()}-pending`;
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      text: content,
      sender: 'user',
      timestamp: new Date(),
    };

    const aiPlaceholder: ChatMessage = {
      id: placeholderId,
      text: 'Sebentar, aku cari jawaban berbasis sumber kesehatan kamu...',
      sender: 'ai',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage, aiPlaceholder]);
    setInput('');

    try {
      const { answer, usedDocs } = await fetchRagAnswer(content);
      const sourceNote = usedDocs.length
        ? `\n\nSumber: ${usedDocs.map(doc => doc.title).join(', ')}`
        : '';
      setMessages(prev =>
        prev.map(msg =>
          msg.id === placeholderId
            ? {
                ...msg,
                text: `${answer}`,
                timestamp: new Date(),
              }
            : msg,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Maaf, aku tidak bisa memanggil AI sekarang.';
      setMessages(prev =>
        prev.map(msg =>
          msg.id === placeholderId
            ? {
                ...msg,
                text: `Maaf, aku gagal mendapatkan jawaban. (${message})`,
                timestamp: new Date(),
              }
            : msg,
        ),
      );
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isUser ? 'flex-end' : 'flex-start' },
        ]}>
        {!isUser && (
          <LinearGradient
            colors={['#000000', '#0073FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.aiAvatar]}>
            <Sparkle size={20} color="#FFF" />
          </LinearGradient>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Markdown
            style={{
              body: {
                color: isUser ? '#FFF' : '#000',
                fontSize: 14,
              },
            }}
          >
            {item.text}
          </Markdown>
          <Text style={[styles.timestamp, isUser ? styles.timestampUser : styles.timestampAI]}>
            {item.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  const header = (
    <ScreenHeader
      title="CAREKU AI"
      subtitle="Teman Sehatmu"
      onBack={() => navigation.goBack()}
    />
  );

  return (
    <View style={styles.screen}>
      {header}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <FlatList
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              messages.length <= 1 ? (
                <View style={styles.quickWrap}>
                  <Text style={styles.quickTitle}>Pertanyaan cepat:</Text>
                  <View style={styles.quickGrid}>
                    {quickQuestions.map((q, idx) => (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.9}
                        style={styles.quickButton}
                        onPress={() => handleSend(q)}>
                        <Text style={styles.quickButtonText}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null
            }
          />
        </View>

        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Ketik pertanyaanmu..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity onPress={() => handleSend()}>
            <LinearGradient
            colors={['#000000', '#0073FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}>
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={22} color="#FFF" />
            )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  root: {
    flex: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroBackButton: {
    padding: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  heroSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '500',
  },
  heroHeart: {
    fontSize: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    maxWidth: '78%',
    padding: 14,
    borderRadius: 22,
  },
  bubbleUser: {
    backgroundColor: '#0073FF',
    borderBottomRightRadius: 8,
  },
  bubbleAI: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bubbleText: {
    color: '#1A1A1A',
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    marginTop: 6,
    fontSize: 10,
  },
  timestampUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  timestampAI: {
    color: '#7C7C7C',
  },
  quickWrap: {
    marginTop: 4,
    gap: 8,
  },
  quickTitle: {
    color: '#7C7C7C',
    fontSize: 12,
    marginBottom: 6,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickButton: {
    flexBasis: '48%',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#FFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  quickButtonText: {
    fontSize: 14,
    color: '#1A1A1A',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    gap: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#bec0c1ff',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#0073FF',
    padding: 12,
    borderRadius: 16,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
});

export default ChatScreen;
