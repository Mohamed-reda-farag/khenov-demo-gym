import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/features/shell/TabBar';
import { useSession } from '@/features/shell/SessionProvider';
import { useTheme } from '@/theme';

export default function TabsLayout() {
  const { status, session } = useSession();
  const { colors } = useTheme();

  if (status === 'ready' && !session.loggedIn) return <Redirect href="/" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="classes" />
      <Tabs.Screen name="workout" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
