import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons'; // Thư viện icon có sẵn trong Expo

export default function CameraScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [facing, setFacing] = useState<'front' | 'back'>('front'); // Mặc định cam trước như Locket
    const cameraRef = useRef<any>(null);

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Cấp quyền Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const toggleCameraFacing = () => {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    };

    return (
        <View style={styles.container}>
            {/* Header: Icon Profile và Bạn bè */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity style={styles.iconCircle}>
                    <Ionicons name="person-circle-outline" size={30} color="white" />
                </TouchableOpacity>

                <View style={styles.friendStatus}>
                    <Ionicons name="people" size={18} color="white" />
                    <Text style={styles.friendText}>3 người bạn</Text>
                </View>

                <TouchableOpacity style={styles.iconCircle}>
                    <Ionicons name="chatbubble-outline" size={26} color="white" />
                </TouchableOpacity>
            </SafeAreaView>

            {/* Khung Camera Bo Góc */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing={facing}
                    ref={cameraRef}
                    responsiveOrientationWhenOrientationLocked
                >
                    {/* Icon Flash và Zoom trong Camera */}
                    <View style={styles.cameraInsideIcons}>
                        <Ionicons name="flash-outline" size={24} color="white" />
                        <View style={styles.zoomBadge}><Text style={styles.zoomText}>1x</Text></View>
                    </View>
                </CameraView>
            </View>

            {/* Bottom: Nút Chụp và Lịch sử */}
            <View style={styles.bottomContainer}>
                <View style={styles.mainControls}>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Ionicons name="images-outline" size={28} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.outerCaptureButton}>
                        <View style={styles.innerCaptureButton} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={toggleCameraFacing}>
                        <Ionicons name="refresh-outline" size={32} color="white" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.historyBtn}>
                    <View style={styles.historyThumb} />
                    <Text style={styles.historyText}>Lịch sử</Text>
                    <Ionicons name="chevron-down" size={16} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    friendStatus: {
        flexDirection: 'row',
        backgroundColor: '#333',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        gap: 8
    },
    friendText: { color: 'white', fontWeight: '600' },
    iconCircle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

    cameraContainer: {
        width: '94%',
        aspectRatio: 3 / 4, // Tỉ lệ khung hình chuẩn Locket
        alignSelf: 'center',
        borderRadius: 40,
        overflow: 'hidden',
        marginTop: 20,
    },
    camera: { flex: 1 },
    cameraInsideIcons: { flexDirection: 'row', justifyContent: 'space-between', padding: 20 },
    zoomBadge: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 5, borderRadius: 15, width: 35, alignItems: 'center' },
    zoomText: { color: 'white', fontSize: 12 },

    bottomContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        paddingHorizontal: 30
    },
    outerCaptureButton: {
        width: 85,
        height: 85,
        borderRadius: 45,
        borderWidth: 4,
        borderColor: '#FFD700', // Màu vàng đặc trưng
        justifyContent: 'center',
        alignItems: 'center'
    },
    innerCaptureButton: {
        width: 65,
        height: 65,
        borderRadius: 35,
        backgroundColor: 'white'
    },
    secondaryButton: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },

    historyBtn: { alignItems: 'center', marginTop: 30 },
    historyThumb: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#555', marginBottom: 5 },
    historyText: { color: 'white', fontWeight: 'bold' },
    permissionButton: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignSelf: 'center', marginTop: '50%' },
});