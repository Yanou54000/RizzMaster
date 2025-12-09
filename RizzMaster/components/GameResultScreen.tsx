import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  isWin: boolean;
  characterName: string;
  greenFlags: number;
  redFlags: number;
  hardNo: boolean;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
};

const GameResultScreen: React.FC<Props> = ({
  isWin,
  characterName,
  greenFlags,
  redFlags,
  hardNo,
  onPlayAgain,
  onBackToMenu,
}) => {
  return (
    <View style={styles.overlay}>
      <View style={[styles.card, isWin ? styles.winCard : styles.loseCard]}>
        <Text style={styles.emoji}>{isWin ? '❤️' : '💔'}</Text>
        <Text style={[styles.title, isWin ? styles.winTitle : styles.loseTitle]}>
          {isWin ? 'C\'est gagné !' : 'Match annulé'}
        </Text>
        <Text style={styles.subtitle}>
          {isWin
            ? `${characterName} veut un second date avec toi !`
            : hardNo
              ? `${characterName} a posé une limite claire...`
              : `${characterName} n'est plus intéressé(e)...`
          }
        </Text>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Green Flags</Text>
            <Text style={[styles.statValue, styles.greenValue]}>{greenFlags}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Red Flags</Text>
            <Text style={[styles.statValue, styles.redValue]}>{redFlags}</Text>
          </View>
          {hardNo && (
            <View style={styles.hardNoRow}>
              <Text style={styles.hardNoText}>Hard No</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={[styles.button, styles.primaryButton]}
            onPress={onPlayAgain}
          >
            <Text style={styles.primaryButtonText}>Rejouer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={[styles.button, styles.secondaryButton]}
            onPress={onBackToMenu}
          >
            <Text style={styles.secondaryButtonText}>Menu principal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default GameResultScreen;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  winCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 3,
    borderColor: '#86efac',
  },
  loseCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 3,
    borderColor: '#fca5a5',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  winTitle: {
    color: '#15803d',
  },
  loseTitle: {
    color: '#dc2626',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  greenValue: {
    color: '#15803d',
  },
  redValue: {
    color: '#dc2626',
  },
  hardNoRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  hardNoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dc2626',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 15,
  },
});
