import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Trash2, Send } from 'lucide-react-native';
import { ThemeColors } from '../constants/theme';
import { authService, UserProfile } from '../services/authService';
import { chatService, ChatMessage } from '../services/chatService';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollViewRef = useRef<ScrollView>(null);

  const recipientId = String(params.recipientId || 'user_seed_01');
  const recipientName = String(params.recipientName || 'Турист');
  const recipientPhone = String(params.recipientPhone || '');
  const avatarEmoji = String(params.avatarEmoji || '🥾');

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    let mounted = true;

    authService.initSession().then((user) => {
      if (!mounted) return;
      setCurrentUser(user);
      if (user) {
        chatService.getConversation(user.id, recipientId).then((conv) => {
          if (mounted) setMessages(conv);
        });
      }
    });

    const interval = setInterval(() => {
      authService.initSession().then((user) => {
        if (!mounted || !user) return;
        chatService.getConversation(user.id, recipientId).then((conv) => {
          if (mounted) setMessages(conv);
        });
      });
    }, 1500);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [recipientId]);

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!currentUser) {
      router.push('/auth');
      return;
    }

    try {
      const sent = await chatService.sendMessage(
        currentUser.id,
        currentUser.username,
        recipientId,
        inputText
      );
      setInputText('');
      setMessages((prev) => [...prev, sent]);
    } catch {
      // error handling
    }
  };

  const handleDeleteChat = () => {
    if (!currentUser) return;
    Alert.alert(
      'Удалить чат?',
      `Вся история переписки с ${recipientName} будет безвозвратно удалена.`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить чат',
          style: 'destructive',
          onPress: async () => {
            await chatService.deleteConversation(currentUser.id, recipientId);
            setMessages([]);
            Alert.alert('Удалено', 'История чата удалена.');
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Recipient Header */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={16} color={ThemeColors.textPrimary} />
            <Text style={styles.backBtnText}>Назад</Text>
          </TouchableOpacity>

          <View style={styles.headerUser}>
            <Text style={styles.headerAvatar}>{avatarEmoji}</Text>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerName}>{recipientName}</Text>
              {recipientPhone ? (
                <Text style={styles.headerPhone}>{recipientPhone}</Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity onPress={handleDeleteChat} style={styles.deleteChatBtn}>
            <Trash2 size={16} color="#F87171" />
          </TouchableOpacity>
        </View>

        {/* Messages Scroll Area */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyBox}>
              <MessageSquare size={42} color={ThemeColors.textMuted} />
              <Text style={styles.emptyText}>
                Начните диалог с {recipientName}!{'\n'}Договоритесь о времени и маршруте похода.
              </Text>
            </View>
          ) : (
            messages.map((msg) => {
              const isMine = currentUser && msg.senderId === currentUser.id;
              const formattedTime = new Date(msg.timestamp).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    isMine ? styles.myMessageRow : styles.otherMessageRow,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isMine ? styles.myBubble : styles.otherBubble,
                    ]}
                  >
                    {!isMine && (
                      <Text style={styles.senderName}>{msg.senderName}</Text>
                    )}
                    <Text style={[styles.messageText, isMine && styles.myMessageText]}>
                      {msg.text}
                    </Text>
                    <Text style={[styles.timeText, isMine && styles.myTimeText]}>
                      {formattedTime}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Напишите сообщение..."
            placeholderTextColor={ThemeColors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ThemeColors.cardBorder,
    justifyContent: 'space-between',
    gap: 8,
  },
  backBtn: {
    backgroundColor: ThemeColors.buttonSecondaryBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ThemeColors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    color: ThemeColors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  headerUser: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTextGroup: {
    flex: 1,
  },
  headerAvatar: {
    fontSize: 24,
  },
  headerName: {
    color: ThemeColors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  headerPhone: {
    color: ThemeColors.accentGreen,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteChatBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  messagesContainer: {
    padding: 14,
    paddingBottom: 20,
    gap: 8,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    color: ThemeColors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myBubble: {
    backgroundColor: ThemeColors.accentGreen,
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: ThemeColors.cardBg,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderBottomLeftRadius: 2,
  },
  senderName: {
    color: ThemeColors.accentGreen,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  messageText: {
    color: ThemeColors.textPrimary,
    fontSize: 14,
    lineHeight: 18,
  },
  myMessageText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeText: {
    fontSize: 9,
    color: ThemeColors.textSecondary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.cardBg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.cardBorder,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: ThemeColors.cardBgSubtle,
    borderColor: ThemeColors.cardBorder,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: ThemeColors.textPrimary,
    fontSize: 13,
    maxHeight: 90,
  },
  sendBtn: {
    backgroundColor: ThemeColors.accentGreen,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
