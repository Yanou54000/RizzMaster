import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type HomepageProps = {
  onPlay?: () => void;
};

const logo = require('../assets/rizz-logo.png');

const Homepage: React.FC<HomepageProps> = ({ onPlay }) => {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />
        <TouchableOpacity
          accessibilityRole="button"
          activeOpacity={0.9}
          style={styles.primary}
          onPress={onPlay}
        >
          <Text style={styles.primaryText}>Jouer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Homepage;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff6ff',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 26,
    elevation: 10,
    gap: 18,
    borderWidth: 2,
    borderColor: '#ffd0f0',
  },
  logoWrap: {
    backgroundColor: '#fefefe',
    borderRadius: 20,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffd48f',
    shadowColor: '#ffae3d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  logo: {
    width: '100%',
    height: 200,
  },
  primary: {
    backgroundColor: '#ff4da1',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff2d64',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#ff9ed1',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.4,
  },
});
