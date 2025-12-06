import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CharacterProfile, DifficultyLevel } from '../types/character';

const profiles: CharacterProfile[] = [
  require('../data/profiles/chloe_spontanee.json'),
  require('../data/profiles/fanny_douce.json'),
  require('../data/profiles/kilian_bobo.json'),
  require('../data/profiles/louis_charo.json'),
];

type Props = {
  onBack: () => void;
  onSelectCharacter: (profile: CharacterProfile) => void;
};

const getDifficultyLabel = (level: DifficultyLevel): string => {
  switch (level) {
    case 'easy':
      return '🟢 Facile';
    case 'medium':
      return '🟠 Moyen';
    case 'hard':
      return '🔴 Difficile';
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
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Choisis ton match</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profiles.map((profile) => (
          <View key={profile.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.name}>{profile.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(profile.difficulty.level) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.difficultyText,
                    { color: getDifficultyColor(profile.difficulty.level) },
                  ]}
                >
                  {getDifficultyLabel(profile.difficulty.level)}
                </Text>
              </View>
            </View>

            <Text style={styles.archetype}>
              {profile.gender === 'female' ? '👩' : '👨'} {profile.personality.archetype.replace(/_/g, ' ')}
            </Text>

            <Text style={styles.bio}>{profile.personality.shortBio}</Text>

            <Text style={styles.toneLabel}>Ton style :</Text>
            <Text style={styles.tone}>{profile.personality.tone}</Text>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.9}
              style={styles.selectButton}
              onPress={() => onSelectCharacter(profile)}
            >
              <Text style={styles.selectButtonText}>Choisir {profile.name}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CharacterSelect;

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff6ff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 2,
    borderColor: '#ffd0f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  archetype: {
    fontSize: 14,
    color: '#6b21a8',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  toneLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9333ea',
    marginTop: 4,
  },
  tone: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  selectButton: {
    marginTop: 8,
    backgroundColor: '#ff4da1',
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff2d64',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#ff9ed1',
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});
