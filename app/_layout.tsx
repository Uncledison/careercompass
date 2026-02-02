import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { Stack, usePathname } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants';

import { ThemeProvider } from '../src/context/ThemeContext';
import { Container } from '../src/components/layout/Container';

declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

export default function RootLayout() {
  const pathname = usePathname();

  // Track Page Views (Web Only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // 1. Initialize dataLayer and gtag if missing
      window.dataLayer = window.dataLayer || [];
      if (!window.gtag) {
        window.gtag = function () {
          window.dataLayer.push(arguments);
        };
        window.gtag('js', new Date());
      }

      // 2. Load Google Analytics script if not already added
      const gaId = 'G-V9WBTTWR46';
      const scriptId = 'google-analytics';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);

        // Initial config
        window.gtag('config', gaId, {
          send_page_view: false, // We'll handle it manually to match SPA navigation
        });
      }

      // 3. Track current page view
      window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title || 'Career Compass',
      });
    }
  }, [pathname]);

  // DevTools 및 우클릭 방지 (Web Only)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U 방지
      const handleKeyDown = (e: KeyboardEvent) => {
        // F12
        if (e.key === 'F12') {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift+I (개발자 도구)
        if (e.ctrlKey && e.shiftKey && e.key === 'I') {
          e.preventDefault();
          return false;
        }
        // Ctrl+Shift+J (콘솔)
        if (e.ctrlKey && e.shiftKey && e.key === 'J') {
          e.preventDefault();
          return false;
        }
        // Ctrl+U (소스 보기)
        if (e.ctrlKey && e.key === 'u') {
          e.preventDefault();
          return false;
        }
      };

      // 우클릭 방지
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);



  return (
    <ThemeProvider>
      <Head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
      </Head>
      <Container maxWidth={500}>
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
          </Stack>
        </GestureHandlerRootView>
      </Container>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
