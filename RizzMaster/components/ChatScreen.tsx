import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CharacterProfile } from '../types/character';
import GameResultScreen from './GameResultScreen';
import { useGameState } from '../hooks/useGameState';
import { useChat, parseAssistantMessage } from '../hooks/useChat';

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
        <Text style={styles.bubbleLabel}>{isUser ? 'Toi' : profile.name}</Text>
        <Text style={styles.bubbleText}>{prettyText}</Text>
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

  const handleBackToMenu = useCallback(() => {
    resetGame();
    onBack?.();
  }, [resetGame, onBack]);

  return (
    <View style={styles.screen}>
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
            <Text style={styles.backLabel}>← Retour</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Chat avec {profile.name}</Text>
        <TouchableOpacity accessibilityRole="button" onPress={resetGame} style={styles.resetButton}>
          <Text style={styles.resetLabel}>🔄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.flagsBar}>
        <View style={styles.flagItem}>
          <Text style={styles.flagEmoji}>🟢</Text>
          <Text style={styles.flagCount}>{flagStats.green}</Text>
          <Text style={styles.flagLabel}>/ {profile.difficulty.minGreenForSecondDate}</Text>
        </View>
        <View style={styles.flagItem}>
          <Text style={styles.flagEmoji}>🔴</Text>
          <Text style={[styles.flagCount, flagStats.red > 0 && styles.redFlagCount]}>{flagStats.red}</Text>
          <Text style={styles.flagLabel}>/ {profile.difficulty.toleranceRed}</Text>
        </View>
        {flagStats.hardNo && (
          <View style={styles.hardNoBadge}>
            <Text style={styles.hardNoText}>⛔ Hard No</Text>
          </View>
        )}
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
              <ActivityIndicator size="small" color="#ff4da1" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backLabel: {
    color: '#ff4da1',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  resetButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  resetLabel: {
    fontSize: 20,
  },
  chatCard: {
    flex: 1,
    backgroundColor: '#fff6ff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ffd0f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
    position: 'relative',
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 24,
    gap: 12,
  },
  helperText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 30,
  },
  bubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffe0f0',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ffd0f0',
  },
  bubbleLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b21a8',
    marginBottom: 4,
  },
  bubbleText: {
    color: '#111827',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#6b7280',
  },
  errorText: {
    marginTop: 8,
    color: '#dc2626',
    textAlign: 'center',
  },
  inputRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 110,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#ffd0f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#111827',
  },
  sendButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#ff4da1',
    minWidth: 90,
    alignItems: 'center',
  },
  sendLabel: {
    color: '#fff',
    fontWeight: '700',
  },
  sendDisabled: {
    opacity: 0.4,
  },
  toBottom: {
    position: 'absolute',
    right: 16,
    bottom: 90,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#ff4da1',
    shadowColor: '#ff2d64',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  toBottomLabel: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  flagsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff6ff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 20,
    borderWidth: 1.5,
    borderColor: '#ffd0f0',
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flagEmoji: {
    fontSize: 18,
  },
  flagCount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  redFlagCount: {
    color: '#dc2626',
  },
  flagLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  hardNoBadge: {
    backgroundColor: '#fee2e2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  hardNoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
});

export default ChatScreen;
