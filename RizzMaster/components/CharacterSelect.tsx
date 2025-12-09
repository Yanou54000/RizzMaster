import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { CharacterProfile, DifficultyLevel } from '../types/character';
import ConversationList from './ConversationList';

const MATCHED_PROFILES_KEY = 'rizzmaster_matched_profiles';
const SKIPPED_PROFILES_KEY = 'rizzmaster_skipped_profiles';

const profiles: CharacterProfile[] = [
  require('../data/profiles/chloe_spontanee.json'),
  require('../data/profiles/fanny_douce.json'),
  require('../data/profiles/kilian_bobo.json'),
  require('../data/profiles/louis_charo.json'),
  require('../data/profiles/melina_pickme.json'),
];

export const avatars: { [key: string]: any } = {
  chloe_avatar: require('../assets/chloeimg.jpg'),
  fanny_avatar: require('../assets/fannyimg.jpg'),
  kilian_avatar: require('../assets/kilianimg.jpeg'),
  louis_avatar: require('../assets/louisimg.webp'),
  melina_avatar: require('../assets/melinaimg.jpg'),
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type Tab = 'swipe' | 'messages';

type Props = {
  onSelectCharacter: (profile: CharacterProfile) => void;
};

const getDifficultyLabel = (level: DifficultyLevel): string => {
  switch (level) {
    case 'easy':
      return 'Facile';
    case 'medium':
      return 'Moyen';
    case 'hard':
      return 'Difficile';
    default:
      return level;
  }
};

const getDifficultyColor = (level: DifficultyLevel): string => {
  switch (level) {
    case 'easy':
      return '#22c55e';
    case 'medium':
      return '#f97316';
    case 'hard':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

const CharacterSelect: React.FC<Props> = ({ onSelectCharacter }) => {
  const [availableProfiles, setAvailableProfiles] = useState<CharacterProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('swipe');
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [skippedIds, setSkippedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const position = useRef(new Animated.ValueXY()).current;
  const availableProfilesRef = useRef<CharacterProfile[]>([]);
  const currentIndexRef = useRef(0);
  const matchedIdsRef = useRef<string[]>([]);
  const skippedIdsRef = useRef<string[]>([]);

  useEffect(() => {
    availableProfilesRef.current = availableProfiles;
  }, [availableProfiles]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    matchedIdsRef.current = matchedIds;
  }, [matchedIds]);

  useEffect(() => {
    skippedIdsRef.current = skippedIds;
  }, [skippedIds]);

  const loadSwipeData = useCallback(async () => {
    try {
      const [matchedData, skippedData] = await Promise.all([
        AsyncStorage.getItem(MATCHED_PROFILES_KEY),
        AsyncStorage.getItem(SKIPPED_PROFILES_KEY),
      ]);

      const matched = matchedData ? JSON.parse(matchedData) : [];
      const skipped = skippedData ? JSON.parse(skippedData) : [];
      setMatchedIds(matched);
      setSkippedIds(skipped);
      const available = profiles.filter(
        (p) => !matched.includes(p.id) && !skipped.includes(p.id)
      );
      setAvailableProfiles(available);
      setCurrentIndex(0);
    } catch (error) {
      console.warn('Error loading swipe data:', error);
      setAvailableProfiles(profiles);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      position.setValue({ x: 0, y: 0 });
      loadSwipeData();
    }, [loadSwipeData])
  );

  useEffect(() => {
    if (activeTab === 'swipe') {
      loadSwipeData();
    }
  }, [activeTab, loadSwipeData]);

  useEffect(() => {
    availableProfiles.forEach((profile) => {
      const avatar = avatars[profile.avatarKey];
      if (avatar) {
        Image.prefetch(Image.resolveAssetSource(avatar).uri);
      }
    });
  }, [availableProfiles]);

  const resetAllSwipes = async () => {
    try {
      await AsyncStorage.removeItem(SKIPPED_PROFILES_KEY);
      await loadSwipeData();
    } catch (error) {
      console.warn('Error resetting swipes:', error);
    }
  };

  const resetAllData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const rizzMasterKeys = keys.filter(key => key.startsWith('rizzmaster_'));
      await AsyncStorage.multiRemove(rizzMasterKeys);

      setMatchedIds([]);
      setSkippedIds([]);
      setAvailableProfiles(profiles);
      setCurrentIndex(0);
    } catch (error) {
      console.warn('Error resetting all data:', error);
    }
  };

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-15deg', '0deg', '15deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start();
  };

  const swipeLeft = () => {
    const profile = availableProfilesRef.current[currentIndexRef.current];
    if (!profile) return;
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      const newSkipped = [...skippedIdsRef.current, profile.id];
      AsyncStorage.setItem(SKIPPED_PROFILES_KEY, JSON.stringify(newSkipped));
      setSkippedIds(newSkipped);
      setCurrentIndex((prev) => prev + 1);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const swipeRight = async () => {
    const profile = availableProfilesRef.current[currentIndexRef.current];
    if (!profile) return;
    setCurrentIndex(prev => prev + 1);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 300,
      useNativeDriver: false,
    }).start(async () => {
      try {
        const chatKey = `rizzmaster_chat_${profile.id}`;
        const flagsKey = `rizzmaster_flags_${profile.id}`;
        await Promise.all([
          AsyncStorage.removeItem(chatKey),
          AsyncStorage.removeItem(flagsKey),
        ]);

        position.setValue({ x: 0, y: 0 });
        onSelectCharacter(profile);
      } catch (error) {
        console.warn('Error clearing chat:', error);
        setCurrentIndex(prev => prev - 1);
      }
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const renderCard = (profile: CharacterProfile, index: number) => {
    if (index < currentIndex) return null;

    if (index === currentIndex) {
      return (
        <Animated.View
          key={profile.id}
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
            <Text style={styles.likeLabelText}>LIKE 💚</Text>
          </Animated.View>
          <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
            <Text style={styles.nopeLabelText}>NEXT ❌</Text>
          </Animated.View>
          {renderCardContent(profile)}
        </Animated.View>
      );
    }

    if (index === currentIndex + 1) {
      const avatar = avatars[profile.avatarKey];
      return (
        <View key={profile.id} style={[styles.card, styles.nextCard]}>
          <ImageBackground
            source={avatar}
            style={styles.cardBackground}
            imageStyle={styles.cardBackgroundImage}
          >
          <BlurView intensity={40} style={StyleSheet.absoluteFill}></BlurView>
          </ImageBackground>
        </View>
      );
    }

    return null;
  };

  const renderCardContent = (profile: CharacterProfile) => {
    const avatar = avatars[profile.avatarKey];
    return (
      <ImageBackground
        source={avatar}
        style={styles.cardBackground}
        imageStyle={styles.cardBackgroundImage}
      >
        <View style={styles.cardGradient}>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{profile.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(profile.difficulty.level) + '40' },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: '#fff' },
                  ]}
                >
                  {getDifficultyLabel(profile.difficulty.level)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ImageBackground>
    );
  };

  const renderSwipeContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      );
    }

    if (currentIndex >= availableProfiles.length) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Plus de profils disponibles !</Text>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetAllSwipes}
          >
            <Text style={styles.resetButtonText}>Recommencer</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.resetButtonTop}>
          <TouchableOpacity
            style={styles.resetAllButton}
            onPress={resetAllData}
          >
            <Text style={styles.resetAllButtonText}>🔄 Réinitialiser tout</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cardsContainer}>
          {availableProfiles.map((profile, index) => renderCard(profile, index)).reverse()}
        </View>
      </>
    );
  };

  return (
    <View style={styles.screen}>
      {activeTab === 'swipe' ? (
        renderSwipeContent()
      ) : (
        <ConversationList onSelectConversation={onSelectCharacter} />
      )}

      <View style={styles.tabBarContainer}>
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'swipe' && styles.tabItemActive]}
            onPress={() => setActiveTab('swipe')}
          >
            <Text style={[styles.tabLabel, activeTab === 'swipe' && styles.tabLabelActive]}>Swipe</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'messages' && styles.tabItemActive]}
            onPress={() => setActiveTab('messages')}
          >
            <Text style={[styles.tabLabel, activeTab === 'messages' && styles.tabLabelActive]}>Messages</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CharacterSelect;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  resetButtonTop: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 100,
  },
  resetAllButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  resetAllButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 100,
    marginTop: -40,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.62,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  nextCard: {
    zIndex: -1,
    transform: [{ scale: 0.95 }],
  },
  cardBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardBackgroundImage: {
    borderRadius: 20,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cardInfo: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  difficultyBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  archetype: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  bio: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  likeLabel: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
    borderWidth: 3,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  likeLabelText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#10b981',
  },
  nopeLabel: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    transform: [{ rotate: '15deg' }],
    borderWidth: 3,
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  nopeLabelText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  resetButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  tabBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: '#0ea5e9',
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9ca3af',
  },
  tabLabelActive: {
    color: '#fff',
  },
});
