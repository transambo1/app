import React, { useEffect } from 'react'; // Nhớ thêm useEffect
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, Alert, Platform } from "react-native";
import { Provider, useSelector } from 'react-redux';
import { store } from './src/store';
import { useAppSync } from './src/hooks/useAppSync';
import { updatePresence } from './src/hooks/userActive';
import AuthScreen from "./src/screens/AuthScreen";
import BottomTabs from "./src/navigation/BottomTabs";
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import { RootState } from './src/store';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

// 1. Cấu hình hiển thị thông báo (Ngay cả khi đang mở app vẫn hiện popup)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const Stack = createNativeStackNavigator();

function AppContent() {
  useAppSync();

  // 2. Xin quyền thông báo khi vừa vào App
  useEffect(() => {
    updatePresence();
    const interval = setInterval(() => {
      updatePresence();
    }, 120000);

    return () => clearInterval(interval);
    async function registerForPushNotifications() {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Thành ơi, người dùng không cho phép hiện thông báo rồi!');
          return;
        }
      } else {
        console.log('Phải dùng máy thật mới test được thông báo Thành nhé!');
      }

      // Cấu hình cho Android (rung, màu sắc đèn led)
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    }

    registerForPushNotifications();
  }, []);

  const { info, loading } = useSelector((state: RootState) => state.user);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4fd1c5" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!info ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={BottomTabs} />
          <Stack.Screen name="Chat" component={ChatDetailScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <AppContent />
      </NavigationContainer>
    </Provider>
  );
}