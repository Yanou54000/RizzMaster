import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterProfile } from '../types/character';
import { parseAssistantMessage } from '../hooks/useChat';

const profiles: CharacterProfile[] = [
  require('../data/profiles/chloe_spontanee.json'),
  require('../data/profiles/fanny_douce.json'),
  require('../data/profiles/kilian_bobo.json'),
  require('../data/profiles/louis_charo.json'),
];

const avatars: { [key: string]: any } = {
  chloe_avatar: require('../assets/chloeimg.jpg'),
  fanny_avatar: require('../assets/fannyimg.jpg'),
  kilian_avatar: require('../assets/kilianimg.jpeg'),
  louis_avatar: require('../assets/louisimg.webp'),
};

const CHAT_STORAGE_KEY_PREFIX = 'rizzmaster_chat_';
const FLAGS_STORAGE_KEY_PREFIX = 'rizzmaster_flags_';
const MATCHED_PROFILES_KEY = 'rizzmaster_matched_profiles';

type Props = {
  onSelectConversation: (profile: CharacterProfile) => void;
};

type ConversationPreview = {
  profile: CharacterProfile;
  lastMessage: string;
  messageCount: number;
  isFromUser: boolean;
  hasUnread: boolean;
};

const ConversationList: React.FC<Props> = ({ onSelectConversation }) => {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const convos: ConversationPreview[] = [];

      for (const profile of profiles) {
        const key = `${CHAT_STORAGE_KEY_PREFIX}${profile.id}`;
        const raw = await AsyncStorage.getItem(key);

        if (raw) {
          const messages = JSON.parse(raw);
          if (Array.isArray(messages) && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            const isFromUser = lastMsg.role === 'user';
            const messageText = isFromUser
              ? lastMsg.content
              : parseAssistantMessage(lastMsg.content);
            convos.push({
              profile,
              lastMessage: messageText.substring(0, 40) + (messageText.length > 40 ? '...' : ''),
              messageCount: messages.length,
              isFromUser,
              hasUnread: !isFromUser,
            });
          }
        }
      }

      setConversations(convos);
    } catch (error) {
      console.warn('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConversation = useCallback(async (profileId: string) => {
    try {
      const chatKey = `${CHAT_STORAGE_KEY_PREFIX}${profileId}`;
      const flagsKey = `${FLAGS_STORAGE_KEY_PREFIX}${profileId}`;
      await Promise.all([
        AsyncStorage.removeItem(chatKey),
        AsyncStorage.removeItem(flagsKey),
      ]);
      const matchedData = await AsyncStorage.getItem(MATCHED_PROFILES_KEY);
      if (matchedData) {
        const matched = JSON.parse(matchedData);
        const updatedMatched = matched.filter((id: string) => id !== profileId);
        await AsyncStorage.setItem(MATCHED_PROFILES_KEY, JSON.stringify(updatedMatched));
      }

      setConversations(prev => prev.filter(c => c.profile.id !== profileId));
    } catch (error) {
      console.warn('Error deleting conversation:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Pas encore de matchs</Text>
            <Text style={styles.emptyText}>
              Swipe à droite sur quelqu'un qui te plaît pour commencer à discuter !
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {conversations.map((convo) => (
          <TouchableOpacity
            key={convo.profile.id}
            style={[styles.conversationItem, convo.hasUnread && styles.conversationItemUnread]}
            onPress={() => onSelectConversation(convo.profile)}
            activeOpacity={0.8}
          >
            <Image
              source={avatars[convo.profile.avatarKey]}
              style={[styles.avatar, convo.hasUnread && styles.avatarUnread]}
            />

            <View style={styles.conversationInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, convo.hasUnread && styles.nameUnread]}>{convo.profile.name}</Text>
                {convo.hasUnread && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.lastMessage, convo.hasUnread && styles.lastMessageUnread]} numberOfLines={1}>
                {convo.isFromUser ? 'Toi: ' : `${convo.profile.name}: `}{convo.lastMessage}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => {
                e.stopPropagation();
                deleteConversation(convo.profile.id);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteIcon}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ConversationList;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conversationItemUnread: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
  },
  avatarUnread: {
    borderWidth: 2,
    borderColor: '#0ea5e9',
  },
  conversationInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  nameUnread: {
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  lastMessage: {
    fontSize: 14,
    color: '#9ca3af',
  },
  lastMessageUnread: {
    color: '#374151',
    fontWeight: '500',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  deleteIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 20,
  },
});
