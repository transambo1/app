import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './src/services/firebase';
import AuthScreen from './src/screens/AuthScreen';
import CameraScreen from './src/screens/CameraScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<'camera' | 'profile'>('camera');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Đã đăng xuất thành công!");
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
    }
  };

  // 1. Nếu chưa đăng nhập -> Hiện màn hình Auth
  if (!user) {
    return <AuthScreen />;
  }

  // 2. Nếu đã đăng nhập -> Hiện Camera hoặc Profile
  if (currentScreen === 'profile') {
    return (
      <View style={styles.container}>
        <ProfileScreen onClose={() => setCurrentScreen('camera')} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraScreen onProfilePress={() => setCurrentScreen('profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});