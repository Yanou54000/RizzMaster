import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';

type HomepageProps = {
  onPlay: () => void;
};

const wallpaper = require('../assets/rizzmasterWallpaper.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOADING_DURATION = 3000; // 3 secondes de chargement

const Homepage: React.FC<HomepageProps> = ({ onPlay }) => {
  const [progress, setProgress] = useState(0);
  const animatedWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: 100,
      duration: LOADING_DURATION,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, LOADING_DURATION / 100);

    const timeout = setTimeout(() => {
      onPlay();
    }, LOADING_DURATION);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [animatedWidth, onPlay]);

  const progressBarWidth = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <ImageBackground source={wallpaper} style={styles.background} resizeMode="cover">
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement... {progress}%</Text>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[styles.progressBarFill, { width: progressBarWidth }]}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

export default Homepage;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 10,
  },
  loadingText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  progressBarBackground: {
    height: 24,
    backgroundColor: 'rgba(255, 224, 240, 0.8)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff9ed1',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff4da1',
    borderRadius: 10,
    shadowColor: '#ff2d64',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
});
