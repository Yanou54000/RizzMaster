import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import Homepage from './components/Homepage';
import CharacterSelect from './components/CharacterSelect';
import ChatScreen from './components/ChatScreen';
import { CharacterProfile } from './types/character';

type RootStackParamList = {
  Home: undefined;
  CharacterSelect: undefined;
  Chat: { profile: CharacterProfile };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Home">
            {({ navigation }) => (
              <Homepage onPlay={() => navigation.navigate('CharacterSelect')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="CharacterSelect">
            {({ navigation }) => (
              <SafeAreaView style={styles.container}>
                <CharacterSelect
                  onBack={() => navigation.goBack()}
                  onSelectCharacter={(profile) => navigation.navigate('Chat', { profile })}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
          <Stack.Screen name="Chat">
            {({ navigation, route }) => (
              <SafeAreaView style={styles.container}>
                <ChatScreen
                  onBack={() => navigation.goBack()}
                  profile={route.params.profile}
                />
              </SafeAreaView>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#7bd1ff',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
