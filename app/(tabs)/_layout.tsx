import { Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useSettings } from '@/SettingsContext'; // Import settings context

export default function TabLayout() {
  const { isDarkMode } = useSettings(); // Get dark mode setting

  // Set navigation bar colors dynamically
  const tabBarBg = isDarkMode ? '#1E1E1E' : Colors.light.background;
  const tabBarTintColor = isDarkMode ? '#FFFFFF' : Colors.light.tint;

  return (
    <View style={{ flex: 1, backgroundColor: tabBarBg }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: tabBarTintColor,
          tabBarInactiveTintColor: tabBarTintColor,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: tabBarBg,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            height: 60,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 5,
            padding: 5,
            marginBottom: -1
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="stat"
          options={{
            title: 'Statistics',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="gearshape.2.fill" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
