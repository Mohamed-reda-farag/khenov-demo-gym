// Each weight is imported from its own file. The package index would bundle every weight of both
// families (13 files, 1.1 MB) although the app uses five.
import Changa_700Bold from '@expo-google-fonts/changa/700Bold/Changa_700Bold.ttf';
import Changa_800ExtraBold from '@expo-google-fonts/changa/800ExtraBold/Changa_800ExtraBold.ttf';
import ReadexPro_400Regular from '@expo-google-fonts/readex-pro/400Regular/ReadexPro_400Regular.ttf';
import ReadexPro_500Medium from '@expo-google-fonts/readex-pro/500Medium/ReadexPro_500Medium.ttf';
import ReadexPro_600SemiBold from '@expo-google-fonts/readex-pro/600SemiBold/ReadexPro_600SemiBold.ttf';
import { LocaleProvider, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastProvider } from '@/components/ui/Toast';
import { useDirection } from '@/i18n/direction';
import { useLanguage } from '@/i18n';
import { ThemeProvider, useTheme } from '@/theme';

import { SessionProvider } from './SessionProvider';
import { useBootstrap } from './useBootstrap';

void SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { colors, mode } = useTheme();
  const { dir } = useDirection();
  const language = useLanguage();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    document.documentElement.style.backgroundColor = colors.background;
  }, [language, dir, colors.background]);

  return (
    <LocaleProvider direction={dir}>
      <View
        style={{ flex: 1, backgroundColor: colors.background, direction: dir }}
        {...(Platform.OS === 'web' ? { dir } : {})}
      >
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
        <ToastProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="class/[sessionId]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="plan/[planId]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="pass" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="notifications" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="membership/index" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen
              name="membership/checkout"
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="session"
              options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="summary/[sessionId]"
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Stack.Screen name="exercises/index" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen
              name="exercises/[exerciseId]"
              options={{ animation: 'slide_from_bottom' }}
            />
          </Stack>
        </ToastProvider>
      </View>
    </LocaleProvider>
  );
}

export function AppRoot() {
  const [fontsLoaded, fontError] = useFonts({
    Changa_700Bold,
    Changa_800ExtraBold,
    ReadexPro_400Regular,
    ReadexPro_500Medium,
    ReadexPro_600SemiBold,
  });
  const boot = useBootstrap();
  const fontsReady = fontsLoaded || fontError !== null;
  const ready = fontsReady && boot.status !== 'loading';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (boot.status === 'loading' || !fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider initialMode={boot.prefs.theme}>
        <SessionProvider>
          <AppShell />
        </SessionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
