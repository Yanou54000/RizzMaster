import { useCallback, useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system/next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterProfile } from '../types/character';
import { FlagStats, GameStatus } from './useGameState';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type ParsedAssistantResponse = {
  message: string;
  flagsDetected: {
    green: number;
    red: number;
    hardNo: boolean;
  };
  gameStatus: GameStatus;
};

const OPENAI_MODEL = 'gpt-4o-mini';
const OPENAI_CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const CHAT_STORAGE_KEY_PREFIX = 'rizzmaster_chat_';

const promptAsset = require('../data/scripts/script.txt');

export const useChat = (
  profile: CharacterProfile,
  flagStats: FlagStats,
  gameStatus: GameStatus,
  onFlagsDetected: (flags: { green: number; red: number; hardNo: boolean }) => void
) => {
  const CHAT_STORAGE_KEY = `${CHAT_STORAGE_KEY_PREFIX}${profile.id}`;

  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [promptError, setPromptError] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Load prompt and history on mount
  useEffect(() => {
    console.log(
      'OpenAI API key loaded?',
      process.env.EXPO_PUBLIC_OPENAI_API_KEY
        ? `${process.env.EXPO_PUBLIC_OPENAI_API_KEY.slice(0, 8)}...`
        : 'absent'
    );

    const loadPrompt = async () => {
      try {
        const asset = Asset.fromModule(promptAsset);
        await asset.downloadAsync();
        if (!asset.localUri) {
          throw new Error('Aucun chemin local pour le script.');
        }
        const file = new File(asset.localUri);
        const basePromptText = await file.text();

        const profileJson = JSON.stringify(profile, null, 2);
        const combinedPrompt = `${basePromptText.trim()}\n\n---\n\nPROFIL DU PERSONNAGE À INCARNER:\n${profileJson}`;

        setSystemPrompt(combinedPrompt);
      } catch (error) {
        console.warn('Prompt loading error', error);
        setPromptError("Impossible de charger le prompt (script.txt).");
      } finally {
        setLoadingPrompt(false);
      }
    };

    const loadHistory = async () => {
      try {
        const raw = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setMessages(parsed);
          }
        }
      } catch (error) {
        console.warn('History loading error', error);
      }
    };

    loadPrompt();
    loadHistory();
  }, [profile, CHAT_STORAGE_KEY]);

  // Persist messages on change
  useEffect(() => {
    const persistHistory = async () => {
      try {
        await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (error) {
        console.warn('History saving error', error);
      }
    };
    persistHistory();
  }, [messages, CHAT_STORAGE_KEY]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || sending || loadingPrompt || !systemPrompt || gameStatus !== null) {
      return;
    }

    const trimmed = input.trim();
    const updatedMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(updatedMessages);
    setSending(true);
    setNetworkError(null);

    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error(
          'EXPO_PUBLIC_OPENAI_API_KEY est manquant. Ajoute ta clé OpenAI dans ton environnement Expo.'
        );
      }

      const contextMessage = `[CONTEXTE INTERNE - NE PAS MENTIONNER: Green flags cumulés: ${flagStats.green}, Red flags cumulés: ${flagStats.red}, Tolérance red: ${profile.difficulty.toleranceRed}, Min green pour gagner: ${profile.difficulty.minGreenForSecondDate}, Échanges: ${Math.floor(updatedMessages.length / 2)}]`;

      const response = await fetch(OPENAI_CHAT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: contextMessage },
            ...updatedMessages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const payload = await response.json();
      const assistantContent: string =
        payload?.choices?.[0]?.message?.content ??
        '{"message": "Impossible de lire la réponse.", "flagsDetected": {"green": 0, "red": 0, "hardNo": false}, "gameStatus": null}';

      const parsedResponse = parseAssistantResponse(assistantContent);
      onFlagsDetected(parsedResponse.flagsDetected);

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      console.warn('OpenAI error', error);
      setNetworkError(
        "Erreur lors de l'appel à ChatGPT. Vérifie ta connexion et ta clé EXPO_PUBLIC_OPENAI_API_KEY."
      );
    } finally {
      setSending(false);
    }
  }, [messages, sending, loadingPrompt, systemPrompt, gameStatus, flagStats, profile.difficulty, onFlagsDetected]);

  const resetChat = useCallback(async () => {
    setMessages([]);
    try {
      await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
    } catch (error) {
      console.warn('Reset chat error', error);
    }
  }, [CHAT_STORAGE_KEY]);

  return {
    messages,
    sending,
    loadingPrompt,
    promptError,
    networkError,
    sendMessage,
    resetChat,
  };
};

const parseAssistantResponse = (raw: string): ParsedAssistantResponse => {
  const defaultResponse: ParsedAssistantResponse = {
    message: '',
    flagsDetected: { green: 0, red: 0, hardNo: false },
    gameStatus: null,
  };

  if (!raw) {
    return defaultResponse;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message || '',
      flagsDetected: {
        green: parsed.flagsDetected?.green || 0,
        red: parsed.flagsDetected?.red || 0,
        hardNo: parsed.flagsDetected?.hardNo || false,
      },
      gameStatus: parsed.gameStatus || null,
    };
  } catch {
    return { ...defaultResponse, message: raw.trim() };
  }
};

export const parseAssistantMessage = (raw: string): string => {
  if (!raw) {
    return '';
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.message === 'string') {
      return parsed.message.trim();
    }
  } catch {
    // Keep raw string if JSON parsing fails
  }

  return raw.trim();
};
