import React from 'react';
import { TouchableOpacity, StyleSheet, View, Platform, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Cần cài thêm expo-blur để có hiệu ứng mờ iOS

import HomeScreen from '../screens/HomeScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import AtlasScreen from '../screens/AtlasScreen';
import CameraScreen from '../screens/CameraScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#a3c0bd',
        tabBarInactiveTintColor: '#999',
        // Hiệu ứng mờ nền cho giống iOS xịn
        tabBarBackground: () => (
          <BlurView intensity={20} style={[
            StyleSheet.absoluteFill,
            { borderRadius: 40, overflow: 'hidden' } // <-- THÊM ĐOẠN NÀY ĐỂ BO GÓC BLURVIEW
          ]} tint="light" />
        ),
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <Ionicons name={focused ? "home" : "home-outline"} size={24} color={focused ? "#ffffff" : "gray"} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <Ionicons name={focused ? "compass" : "compass-outline"} size={24} color={focused ? '#ffffff' : 'gray'} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          tabBarStyle: { display: 'none' },
          tabBarIcon: () => (
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={30} color="grey" />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Atlas"
        component={AtlasScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <Ionicons name={focused ? "map" : "map-outline"} size={24} color={focused ? '#ffffff' : 'gray'} />
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={focused ? styles.activeTab : null}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={focused ? '#ffffff' : 'gray'} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    width: Dimensions.get('window').width * 0.88,
    marginLeft: Dimensions.get('window').width * 0.06,
    marginRight: Dimensions.get('window').width * 0.06,
    bottom: 20,
    height: 50,
    borderRadius: 40,
    backgroundColor: 'rgba(207, 204, 204, 0.7)', // Nền trắng trong suốt nhẹ
    borderTopWidth: 0, // Xóa đường kẻ ngang

    marginBottom: 0,
    // Đổ bóng kiểu iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 40 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    paddingBottom: Platform.OS === 'ios' ? 0 : 0, // Tùy chỉnh cho Android/iOS
  },
  cameraButton: {
    top: -15, // Nút camera lồi lên trên
    width: 60,
    height: 60,
    borderRadius: 32.5,
    backgroundColor: '#95f4eae7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(167, 166, 166, 0.7)', // Tạo viền trắng bao quanh nút cho tách biệt
    shadowColor: '#addbff',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  activeTab: {
    // Nền xanh nhạt khi focus

    paddingVertical: 8,
    borderRadius: 25,
    marginTop: 12,
    height: 48,
    width: 66,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(138, 138, 138, 0.8)',
    //backgroundColor: 'rgba(59, 191, 178, 0.8)',
  }
});

//
