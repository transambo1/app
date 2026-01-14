import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './src/services/firebase';
import AuthScreen from './src/screens/AuthScreen';
import CameraScreen from './src/screens/CameraScreen';

export default function App() {
  const [user, setUser] = useState<User | null>(null);

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

  // 2. Nếu đã đăng nhập -> Hiện Camera và nút Đăng xuất nhỏ gọn
  return (
    <View style={styles.container}>
      {/* Hiển thị Camera làm nền chính */}
      <CameraScreen />

      {/* Nút Đăng xuất đặt ở góc trên bên phải (giống icon profile trong Locket) */}
      <SafeAreaView style={styles.overlayHeader}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlayHeader: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10, // Để nút luôn nằm trên Camera
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.7)', // Màu đỏ hơi trong suốt
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
});