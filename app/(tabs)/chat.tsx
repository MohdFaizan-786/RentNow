import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
  background: '#EAE6DD',
  teal: '#2A5C59',
  tealDark: '#1E4442',
  white: '#FFFFFF',
  textDark: '#1A2A2A',
  textMedium: '#444444',
  textLight: '#888888',
  border: '#D5CFC4',
  chipBg: '#E4DED3',
};

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    conversationId: string;
    propertyTitle: string;
    otherPersonName: string;
  }>();

  const conversationId = params.conversationId;
  const propertyTitle = params.propertyTitle;
  const otherPersonName = params.otherPersonName;

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<any>(null);
  const messagesRef = useRef<any[]>([]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!conversationId) return;
    init();
    return () => {
      cleanup();
    };
  }, [conversationId]);

  const cleanup = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  };

  const init = async () => {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
      }
      // Fetch existing messages
      await fetchMessages();
      // Setup realtime AFTER fetching
      setupRealtime();
    } catch (error) {
      console.error('Init error:', error);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
      messagesRef.current = data || [];

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    cleanup();

    const channelName = `messages_${conversationId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: '' },
      },
    });

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          const newMsg = payload.new;
          // Check if message already exists
          const exists = messagesRef.current.some(m => m.id === newMsg.id);
          if (!exists) {
            const updated = [...messagesRef.current, newMsg];
            messagesRef.current = updated;
            setMessages(updated);
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe((status: string) => {
        console.log(`Realtime status for ${channelName}:`, status);
      });

    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;
    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          message: messageText,
        })
        .select('*')
        .single();

      if (error) throw error;

      // Add sent message immediately to UI
      if (data) {
        const exists = messagesRef.current.some(m => m.id === data.id);
        if (!exists) {
          const updated = [...messagesRef.current, data];
          messagesRef.current = updated;
          setMessages(updated);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    } catch (error: any) {
      Alert.alert('❌ Error', 'Failed to send message. Please try again.');
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isSent = item.sender_id === currentUserId;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDate = !prevMessage ||
      formatDate(prevMessage.created_at) !== formatDate(item.created_at);

    return (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {formatDate(item.created_at)}
            </Text>
          </View>
        )}
        <View style={[
          styles.messageRow,
          isSent ? styles.messageRowSent : styles.messageRowReceived,
        ]}>
          <View style={[
            styles.messageBubble,
            isSent ? styles.sentBubble : styles.receivedBubble,
          ]}>
            <Text style={[
              styles.messageText,
              isSent ? styles.sentText : styles.receivedText,
            ]}>
              {item.message}
            </Text>
            <Text style={[
              styles.messageTime,
              isSent ? styles.sentTime : styles.receivedTime,
            ]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.tealDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerAvatar}>
          <Text style={styles.headerAvatarText}>
            {otherPersonName?.charAt(0)?.toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {otherPersonName}
          </Text>
          <Text style={styles.headerProperty} numberOfLines={1}>
            🏠 {propertyTitle}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.teal}
            style={{ marginTop: 40 }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={[
              styles.messagesList,
              messages.length === 0 && styles.messagesListEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>💬</Text>
                <Text style={styles.emptyChatTitle}>No messages yet</Text>
                <Text style={styles.emptyChatSubtitle}>
                  Say hello to start the conversation!
                </Text>
              </View>
            }
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!newMessage.trim() || sending) && styles.sendBtnDisabled,
            ]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color={COLORS.white} size="small" />
              : <Text style={styles.sendBtnText}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.tealDark,
    paddingHorizontal: 16, paddingVertical: 14,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  backBtn: { marginRight: 10, padding: 4 },
  backText: { color: COLORS.white, fontSize: 22, fontWeight: '700' },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  headerAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 18 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  headerProperty: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  messagesList: { padding: 16 },
  messagesListEmpty: { flex: 1 },
  dateSeparator: { alignItems: 'center', marginVertical: 12 },
  dateSeparatorText: {
    fontSize: 12, color: COLORS.textLight,
    backgroundColor: COLORS.chipBg,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10,
  },
  messageRow: { marginBottom: 4 },
  messageRowSent: { alignItems: 'flex-end' },
  messageRowReceived: { alignItems: 'flex-start' },
  messageBubble: {
    maxWidth: '75%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  sentBubble: {
    backgroundColor: COLORS.teal,
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    elevation: 1, shadowColor: '#000',
    shadowOpacity: 0.06, shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  messageText: { fontSize: 15, lineHeight: 21 },
  sentText: { color: COLORS.white },
  receivedText: { color: COLORS.textDark },
  messageTime: { fontSize: 10, marginTop: 3, textAlign: 'right' },
  sentTime: { color: 'rgba(255,255,255,0.6)' },
  receivedTime: { color: COLORS.textLight },
  emptyChat: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', paddingTop: 80,
  },
  emptyChatIcon: { fontSize: 56, marginBottom: 16 },
  emptyChatTitle: {
    fontSize: 18, fontWeight: '700',
    color: COLORS.tealDark, marginBottom: 8,
  },
  emptyChatSubtitle: {
    fontSize: 14, color: COLORS.textMedium,
    textAlign: 'center', paddingHorizontal: 32,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, backgroundColor: COLORS.chipBg,
    borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15,
    color: COLORS.textDark, maxHeight: 100, marginRight: 8,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.border },
  sendBtnText: { color: COLORS.white, fontSize: 18, fontWeight: '700' },
});