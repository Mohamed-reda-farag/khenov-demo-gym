import { Changa_700Bold, Changa_800ExtraBold } from '@expo-google-fonts/changa';
import {
  ReadexPro_400Regular,
  ReadexPro_500Medium,
  ReadexPro_600SemiBold,
} from '@expo-google-fonts/readex-pro';
import { LocaleProvider, Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
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
