import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { Colors } from '../src/constants';

import { ThemeProvider } from '../src/context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={styles.container}>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.background.primary },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="help" />
          <Stack.Screen name="stats" />
          <Stack.Screen name="career/[field]" />
          <Stack.Screen name="history/[id]" />
          <Stack.Screen
            name="assessment/[level]"
            options={{
              gestureEnabled: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen name="result/[id]" />
          <Stack.Screen
            name="game/memory"
            options={{
              headerShown: false,
              presentation: 'fullScreenModal',
              animation: 'fade_from_bottom'
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
