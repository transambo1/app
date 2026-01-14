import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { auth } from './src/services/firebase'; // Kiểm tra đúng đường dẫn file

export default function App() {
  useEffect(() => {
    // Kiểm tra xem đối tượng auth có tồn tại không
    if (auth) {
      console.log("✅ Kết nối Firebase thành công!");
    } else {
      console.log("❌ Kết nối Firebase thất bại.");
    }
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Kiểm tra Firebase trong Terminal nhé!</Text>
    </View>
  );
}