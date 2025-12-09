import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CharacterProfile } from '../types/character';

export type FlagStats = {
  green: number;
  red: number;
  hardNo: boolean;
};

export type GameStatus = 'GAME_OVER' | 'GAME_WON' | null;

const FLAGS_STORAGE_KEY_PREFIX = 'rizzmaster_flags_';

export const useGameState = (profile: CharacterProfile) => {
  const FLAGS_STORAGE_KEY = `${FLAGS_STORAGE_KEY_PREFIX}${profile.id}`;

  const [flagStats, setFlagStats] = useState<FlagStats>({ green: 0, red: 0, hardNo: false });
  const [gameStatus, setGameStatus] = useState<GameStatus>(null);

  useEffect(() => {
    const loadFlags = async () => {
      try {
        const flagsRaw = await AsyncStorage.getItem(FLAGS_STORAGE_KEY);
        if (flagsRaw) {
          const parsedFlags = JSON.parse(flagsRaw);
          setFlagStats(parsedFlags.stats || { green: 0, red: 0, hardNo: false });
          setGameStatus(parsedFlags.gameStatus || null);
        }
      } catch (error) {
        console.warn('Flags loading error', error);
      }
    };
    loadFlags();
  }, [FLAGS_STORAGE_KEY]);

  useEffect(() => {
    const persistFlags = async () => {
      try {
        await AsyncStorage.setItem(FLAGS_STORAGE_KEY, JSON.stringify({
          stats: flagStats,
          gameStatus: gameStatus,
        }));
      } catch (error) {
        console.warn('Flags saving error', error);
      }
    };
    persistFlags();
  }, [flagStats, gameStatus, FLAGS_STORAGE_KEY]);

  const updateFlags = useCallback((detectedFlags: { green: number; red: number; hardNo: boolean }) => {
    const newGreen = flagStats.green + detectedFlags.green;
    const newRed = flagStats.red + detectedFlags.red;
    const newHardNo = flagStats.hardNo || detectedFlags.hardNo;

    setFlagStats({
      green: newGreen,
      red: newRed,
      hardNo: newHardNo,
    });

    let finalGameStatus: GameStatus = null;

    if (newRed >= profile.difficulty.toleranceRed || newHardNo) {
      finalGameStatus = 'GAME_OVER';
    } else if (
      newGreen >= profile.difficulty.minGreenForSecondDate &&
      newRed < profile.difficulty.toleranceRed
    ) {
      finalGameStatus = 'GAME_WON';
    }

    if (finalGameStatus) {
      setGameStatus(finalGameStatus);
    }

    return finalGameStatus;
  }, [flagStats, profile.difficulty]);

  const resetGameState = useCallback(async () => {
    setFlagStats({ green: 0, red: 0, hardNo: false });
    setGameStatus(null);
    try {
      await AsyncStorage.removeItem(FLAGS_STORAGE_KEY);
    } catch (error) {
      console.warn('Reset flags error', error);
    }
  }, [FLAGS_STORAGE_KEY]);

  return {
    flagStats,
    gameStatus,
    updateFlags,
    resetGameState,
  };
};
