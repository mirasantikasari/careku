import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SplashScreen from '../screens/SplashScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';
import DiaryScreen from '../screens/DiaryScreen';
import ChatScreen from '../screens/ChatScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BottomNav from '../ui/BottomNav';
import FoodScreen from '../screens/FoodScreen';
import LoginScreen from '../screens/LoginScreen';
import CalendarScreen from '../screens/CalendarScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StatsScreen from '../screens/StatsScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';

export type TabParamList = {
  Home: undefined;
  Calendar: undefined;
  Chat: undefined;
  Stats: undefined;
  Food: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  Notifications: undefined;
  Diary: undefined;
  Food: undefined;
  Calendar: undefined;
  ProfileEdit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={props => <BottomNav {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Notifications" component={PlaceholderScreen} />
        <Stack.Screen name="Diary" component={DiaryScreen} />
        <Stack.Screen name="Food" component={FoodScreen} />
        <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
