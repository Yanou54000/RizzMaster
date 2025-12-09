import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { CharacterProfile } from '../types/character';
import GameResultScreen from './GameResultScreen';
import { useGameState } from '../hooks/useGameState';
import { useChat, parseAssistantMessage } from '../hooks/useChat';
import { avatars } from './CharacterSelect';

const MATCHED_PROFILES_KEY = 'rizzmaster_matched_profiles';

type Props = {
  onBack?: () => void;
  profile: CharacterProfile;
};

const ChatScreen: React.FC<Props> = ({ onBack, profile }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { flagStats, gameStatus, updateFlags, resetGameState } = useGameState(profile);

  const {
    messages,
    sending,
    loadingPrompt,
    promptError,
    networkError,
    sendMessage,
    resetChat,
  } = useChat(profile, flagStats, gameStatus, updateFlags);

  const hasContent = messages.length > 0;
  const isSendDisabled = sending || loadingPrompt || !input.trim() || gameStatus !== null;

  const handleSend = useCallback(() => {
    if (isSendDisabled) return;
    sendMessage(input);
    setInput('');
  }, [input, isSendDisabled, sendMessage]);

  const renderMessage = useCallback((message: { role: 'user' | 'assistant'; content: string }, index: number) => {
    const isUser = message.role === 'user';
    const prettyText = isUser ? message.content : parseAssistantMessage(message.content);

    return (
      <View
        key={`${message.role}-${index}`}
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
      >
        <Text style={[styles.bubbleLabel, isUser ? styles.userBubbleLabel : styles.assistantBubbleLabel]}>
          {isUser ? 'Toi' : profile.name}
        </Text>
        <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.assistantBubbleText]}>
          {prettyText}
        </Text>
      </View>
    );
  }, [profile.name]);

  const helperText = useMemo(() => {
    if (promptError) return promptError;
    if (loadingPrompt) return 'Chargement du script...';
    if (!hasContent) return 'Commence la discussion en écrivant ton premier message.';
    return null;
  }, [hasContent, loadingPrompt, promptError]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 48;
    setIsAtBottom(nearBottom);
  }, []);

  const showScrollDownButton = !isAtBottom && messages.length > 0;

  const resetGame = useCallback(async () => {
    await resetChat();
    await resetGameState();
  }, [resetChat, resetGameState]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
  }, [resetGame]);

  const handleBackToMenu = useCallback(async () => {
    await resetGame();
    try {
      const matchedData = await AsyncStorage.getItem(MATCHED_PROFILES_KEY);
      if (matchedData) {
        const matched = JSON.parse(matchedData);
        const updatedMatched = matched.filter((id: string) => id !== profile.id);
        await AsyncStorage.setItem(MATCHED_PROFILES_KEY, JSON.stringify(updatedMatched));
      }
    } catch (error) {
      console.warn('Error removing from matched:', error);
    }
    onBack?.();
  }, [resetGame, onBack, profile.id]);

  const indicatorPosition = useMemo(() => {
    const balance = flagStats.green - flagStats.red;
    const maxRange = 5;
    const percentage = 50 + (balance / maxRange) * 50;
    return Math.max(0, Math.min(100, percentage));
  }, [flagStats.green, flagStats.red]);

  const indicatorColor = useMemo(() => {
    if (indicatorPosition < 33) return '#ef4444';
    if (indicatorPosition < 66) return '#f97316';
    return '#22c55e';
  }, [indicatorPosition]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {gameStatus && (
        <GameResultScreen
          isWin={gameStatus === 'GAME_WON'}
          characterName={profile.name}
          greenFlags={flagStats.green}
          redFlags={flagStats.red}
          hardNo={flagStats.hardNo}
          onPlayAgain={handlePlayAgain}
          onBackToMenu={handleBackToMenu}
        />
      )}

      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.backButton}>
            <Text style={styles.backLabel}>←</Text>
          </TouchableOpacity>
        )}
        <Image source={avatars[profile.avatarKey]} style={styles.headerAvatar} />
        <Text style={styles.title}>{profile.name}</Text>
      </View>

      <View style={styles.flagsBar}>
        <View style={styles.gaugeContainer}>
          <View style={styles.gaugeTrack}>
            <LinearGradient
              colors={['#ef4444', '#f97316', '#fbbf24', '#a3e635', '#22c55e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gaugeGradient}
            />
            <View
              style={[
                styles.gaugeIndicator,
                {
                  left: `${indicatorPosition}%`,
                  backgroundColor: indicatorColor,
                }
              ]}
            >
              <View style={styles.gaugeIndicatorInner} />
            </View>
          </View>

          <View style={styles.gaugeLegend}>
          </View>
        </View>
      </View>

      <View style={styles.chatCard}>
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            if (isAtBottom) {
              scrollRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator
        >
          {helperText ? (
            <Text style={styles.helperText}>{helperText}</Text>
          ) : (
            messages.map(renderMessage)
          )}
          {sending && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0ea5e9" />
              <Text style={styles.loadingText}>{profile.name} écrit...</Text>
            </View>
          )}
        </ScrollView>

        {showScrollDownButton && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
            style={styles.toBottom}
          >
            <Text style={styles.toBottomLabel}>Retour en bas</Text>
          </TouchableOpacity>
        )}

        {networkError && <Text style={styles.errorText}>{networkError}</Text>}

        <View style={styles.inputRow}>
          <TextInput
            multiline
            placeholder={loadingPrompt ? 'Chargement...' : 'Écris ton message ici...'}
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            editable={!loadingPrompt}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleSend}
            disabled={isSendDisabled}
            style={[styles.sendButton, isSendDisabled && styles.sendDisabled]}
          >
            <Text style={styles.sendLabel}>{sending ? '...' : 'Envoyer'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: -16,
    marginTop: -12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backLabel: {
    color: '#0ea5e9',
    fontWeight: '600',
    fontSize: 22,
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  chatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 20,
    gap: 10,
  },
  helperText: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0ea5e9',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
  },
  bubbleLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  userBubbleLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  assistantBubbleLabel: {
    color: '#6b7280',
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userBubbleText: {
    color: '#fff',
  },
  assistantBubbleText: {
    color: '#111827',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  errorText: {
    marginTop: 8,
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 13,
  },
  inputRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
    color: '#111827',
    fontSize: 15,
  },
  sendButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
  },
  sendLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  toBottom: {
    position: 'absolute',
    right: 14,
    bottom: 80,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  toBottomLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  flagsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  gaugeContainer: {
    width: '100%',
  },
  gaugeTrack: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    position: 'relative',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  gaugeGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  gaugeIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeIndicatorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  gaugeLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  gaugeLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gaugeLegendEmoji: {
    fontSize: 16,
  },
  gaugeLegendText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  gaugeCenter: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  gaugeCenterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ChatScreen;
