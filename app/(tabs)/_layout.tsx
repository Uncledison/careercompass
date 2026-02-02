import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Colors, Layout } from '../../src/constants';

// 커스텀 탭 아이콘들
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H4C3.45 21 3 20.55 3 20V9.5Z"
      fill={focused ? Colors.primary.main : 'none'}
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {focused && (
      <Rect x={9} y={14} width={6} height={7} fill={Colors.background.primary} rx={1} />
    )}
  </Svg>
);

const AssessmentIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Circle
      cx={12}
      cy={12}
      r={9}
      fill={focused ? Colors.primary.main : 'none'}
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
    />
    <Path
      d="M12 7V12L15 15"
      stroke={focused ? Colors.background.primary : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const HistoryIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Rect
      x={4}
      y={4}
      width={16}
      height={16}
      rx={2}
      fill={focused ? Colors.primary.main : 'none'}
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
    />
    <Path
      d="M8 10H16M8 14H13"
      stroke={focused ? Colors.background.primary : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Circle
      cx={12}
      cy={8}
      r={4}
      fill={focused ? Colors.primary.main : 'none'}
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
    />
    <Path
      d="M4 20C4 17 7.5 14 12 14C16.5 14 20 17 20 20"
      fill={focused ? Colors.primary.main : 'none'}
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

const StatsIcon = ({ focused }: { focused: boolean }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24">
    <Path
      d="M3 3v18h18"
      stroke={focused ? Colors.gray[400] : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
      fill="none"
    />
    <Path
      d="M18 17V9"
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M13 17V5"
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
    <Path
      d="M8 17v-5"
      stroke={focused ? Colors.primary.main : Colors.gray[400]}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + Math.max(insets.bottom, 12),
          paddingBottom: Math.max(insets.bottom, 12),
        },
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.gray[400],
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => <HomeIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="assessment"
        options={{
          title: '검사',
          tabBarIcon: ({ focused }) => <AssessmentIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '기록',
          tabBarIcon: ({ focused }) => <HistoryIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '분석',
          tabBarIcon: ({ focused }) => <StatsIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ focused }) => <ProfileIcon focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.primary,
    borderTopWidth: 0,
    paddingTop: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  tabBarItem: {
    paddingTop: 4,
  },
});
