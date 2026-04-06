import { Tabs } from 'expo-router';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="who-are-you" />
      <Tabs.Screen name="login" />
      <Tabs.Screen name="signup" />
      <Tabs.Screen name="tenant-signup-step1" />
      <Tabs.Screen name="tenant-signup-step2" />
      <Tabs.Screen name="tenant-signup-step3" />
      <Tabs.Screen name="landlord-signup-step1" />
      <Tabs.Screen name="landlord-signup-step2" />
      <Tabs.Screen name="landlord-signup-step3" />
      <Tabs.Screen name="landlord-dashboard" />
      <Tabs.Screen name="add-property-step1" />
      <Tabs.Screen name="add-property-step2" />
      <Tabs.Screen name="property-detail" />
      <Tabs.Screen name="tenant-profile" />
      <Tabs.Screen name="admin-login" />
      <Tabs.Screen name="admin-dashboard" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="conversations" />
    </Tabs>
  );
}