import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import { SettingsProvider } from './src/context/SettingsContext';
import HomeScreen from './src/screens/HomeScreen';
import PointsScreen from './src/screens/PointsScreen';
import MarketScreen from './src/screens/MarketScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AchievementScreen from './src/screens/AchievementScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import InviteScreen from './src/screens/InviteScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <UserProvider>
      <SettingsProvider>
        <SafeAreaProvider>
          <NavigationContainer>
            <Tab.Navigator
              screenOptions={{
                tabBarStyle: { height: 65, paddingBottom: 8 },
                tabBarLabelStyle: { fontSize: 11 },
                tabBarIcon: ({ route }) => {
                  const icons: Record<string, string> = {
                    '홈': '🏠',
                    '포인트': '💰',
                    '마켓': '🛒',
                    '프로필': '👤',
                    '업적': '🏆',
                    '랭킹': '📊',
                    '초대': '📨',
                    '설정': '⚙️',
                  };
                  return <Text style={{ fontSize: 22 }}>{icons[route?.name] || '📱'}</Text>;
                }
              }}
            >
              <Tab.Screen name="홈" component={HomeScreen} />
              <Tab.Screen name="포인트" component={PointsScreen} />
              <Tab.Screen name="마켓" component={MarketScreen} />
              <Tab.Screen name="프로필" component={ProfileScreen} />
              <Tab.Screen name="업적" component={AchievementScreen} />
              <Tab.Screen name="랭킹" component={LeaderboardScreen} />
              <Tab.Screen name="초대" component={InviteScreen} />
              <Tab.Screen name="설정" component={SettingsScreen} />
            </Tab.Navigator>
          </NavigationContainer>
        </SafeAreaProvider>
      </SettingsProvider>
    </UserProvider>
  );
}
