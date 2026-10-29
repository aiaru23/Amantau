import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  text: string;
  timestamp: number;
  read?: boolean;
}

const STORAGE_KEYS = {
  CHAT_MESSAGES: '@amantau_chat_messages',
};

const CLOUD_CHATS_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a125a79e093560';

class ChatServiceManager {
  public async getConversation(
    currentUserId: string,
    otherUserId: string
  ): Promise<ChatMessage[]> {
    await this.syncCloudMessages();
    const all = await this.getAllMessages();

    let updated = false;
    const conversation = all.map((m) => {
      if (
        m.senderId === otherUserId &&
        m.recipientId === currentUserId &&
        !m.read
      ) {
        updated = true;
        return { ...m, read: true };
      }
      return m;
    });

    if (updated) {
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(conversation));
      this.saveAllMessagesToCloud(conversation).catch(() => {});
    }

    return conversation
      .filter(
        (m) =>
          (m.senderId === currentUserId && m.recipientId === otherUserId) ||
          (m.senderId === otherUserId && m.recipientId === currentUserId)
      )
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  public async sendMessage(
    senderId: string,
    senderName: string,
    recipientId: string,
    text: string
  ): Promise<ChatMessage> {
    const cleanText = text.trim();
    if (!cleanText) throw new Error('Сообщение не может быть пустым.');

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      senderId,
      senderName,
      recipientId,
      text: cleanText,
      timestamp: Date.now(),
      read: false,
    };

    const all = await this.getAllMessages();
    const updated = [...all, newMsg];
    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(updated));

    this.saveAllMessagesToCloud(updated).catch(() => {});

    return newMsg;
  }

  public async getUnreadCounts(currentUserId: string): Promise<Record<string, number>> {
    await this.syncCloudMessages();
    const all = await this.getAllMessages();
    const counts: Record<string, number> = {};

    all.forEach((m) => {
      if (m.recipientId === currentUserId && !m.read) {
        counts[m.senderId] = (counts[m.senderId] || 0) + 1;
      }
    });

    return counts;
  }

  public async getLastMessageTimestamps(currentUserId: string): Promise<Record<string, { timestamp: number; text: string }>> {
    const all = await this.getAllMessages();
    const map: Record<string, { timestamp: number; text: string }> = {};

    all.forEach((m) => {
      if (m.senderId === currentUserId || m.recipientId === currentUserId) {
        const targetId = m.senderId === currentUserId ? m.recipientId : m.senderId;
        if (!map[targetId] || m.timestamp > map[targetId].timestamp) {
          map[targetId] = { timestamp: m.timestamp, text: m.text };
        }
      }
    });

    return map;
  }

  public async deleteConversation(
    userId1: string,
    userId2: string
  ): Promise<void> {
    const all = await this.getAllMessages();
    const filtered = all.filter(
      (m) =>
        !(
          (m.senderId === userId1 && m.recipientId === userId2) ||
          (m.senderId === userId2 && m.recipientId === userId1)
        )
    );

    await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(filtered));
    await this.saveAllMessagesToCloud(filtered);
  }

  private async saveAllMessagesToCloud(messages: ChatMessage[]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);

      await fetch(CLOUD_CHATS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'AmanTau Chat Messages',
          data: { messages },
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
    } catch {
      // ignore
    }
  }

  private async fetchCloudMessages(): Promise<ChatMessage[]> {
    try {
      const response = await fetch(CLOUD_CHATS_ENDPOINT);
      const json = await response.json();
      if (json && json.data && Array.isArray(json.data.messages)) {
        return json.data.messages;
      }
      return [];
    } catch {
      return [];
    }
  }

  private async syncCloudMessages(): Promise<void> {
    try {
      const cloudMsgs = await this.fetchCloudMessages();
      if (cloudMsgs.length > 0) {
        const localMsgs = await this.getAllMessages();
        const msgMap = new Map<string, ChatMessage>();

        localMsgs.forEach((m) => msgMap.set(m.id, m));
        cloudMsgs.forEach((m) => {
          const existing = msgMap.get(m.id);
          msgMap.set(m.id, existing ? { ...existing, ...m } : m);
        });

        const merged = Array.from(msgMap.values());
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_MESSAGES, JSON.stringify(merged));
      }
    } catch {
      // offline fallback
    }
  }

  private async getAllMessages(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_MESSAGES);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const chatService = new ChatServiceManager();
