import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Image, TextInput, ScrollView, KeyboardAvoidingView,
    Platform, ActivityIndicator, Alert, ImageBackground
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { uploadToCloudinary } from '../../services/cloudinary'; // Nhớ check đúng đường dẫn

export default function CreateExplorePlacesScreen() {
    const navigation = useNavigation<any>();

    // State lưu trữ dữ liệu người dùng nhập
    const [tripName, setTripName] = useState('');
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Hàm xử lý chọn ảnh và upload lên Cloudinary
    const handlePickAndUploadImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Cấp quyền", "Bạn cần cho phép truy cập thư viện ảnh để chọn cover!");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.8,
        });

        if (!result.canceled) {
            setIsUploading(true);
            const uri = result.assets[0].uri;

            const uploadedUrl = await uploadToCloudinary(uri);

            if (uploadedUrl) {
                setCoverImage(uploadedUrl);
            } else {
                Alert.alert("Lỗi", "Không thể tải ảnh lên Cloudinary. Vui lòng thử lại!");
            }
            setIsUploading(false);
        }
    };

    // Hàm chuyển sang Bước 2
    const handleContinue = () => {
        if (!tripName.trim()) {
            Alert.alert("Thiếu thông tin", "Vui lòng nhập tên chuyến đi nhé!");
            return;
        }

        // Truyền dữ liệu sang SelectDatesScreen
        navigation.navigate('SelectDates', {
            tripName: tripName,
            coverImage: coverImage || 'https://images.unsplash.com/photo-1514222329107-cdececf0656a?q=80&w=800',
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                        <Ionicons name="close" size={28} color="#114C5A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Digital Concierge</Text>
                    <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.headerAvatar} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Text style={styles.stepText}>STEP 01 OF 03</Text>
                    <Text style={styles.mainTitle}>New Adventure</Text>
                    <Text style={styles.subtext}>Every great journey starts with a name and a vision. Let's begin crafting yours.</Text>

                    {/* --- KHU VỰC ẢNH COVER --- */}
                    <View style={styles.coverContainer}>
                        {coverImage ? (
                            <ImageBackground source={{ uri: coverImage }} style={styles.coverPlaceholder} imageStyle={{ borderRadius: 24 }}>
                                <TouchableOpacity style={styles.addCoverBtn} onPress={handlePickAndUploadImage} disabled={isUploading}>
                                    {isUploading ? <ActivityIndicator color="#114C5A" /> : <Ionicons name="camera" size={20} color="#114C5A" />}
                                    <Text style={styles.addCoverText}>{isUploading ? 'Uploading...' : 'Change Cover'}</Text>
                                </TouchableOpacity>
                            </ImageBackground>
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <TouchableOpacity style={styles.addCoverBtn} onPress={handlePickAndUploadImage} disabled={isUploading}>
                                    {isUploading ? <ActivityIndicator color="#114C5A" /> : <Ionicons name="camera" size={20} color="#114C5A" />}
                                    <Text style={styles.addCoverText}>{isUploading ? 'Uploading...' : 'Add Cover Photo'}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Trip Name Input */}
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>TRIP NAME</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="e.g., Winter in Iceland"
                                placeholderTextColor="#99A3B0"
                                value={tripName}
                                onChangeText={setTripName}
                            />
                            <Ionicons name="pencil" size={20} color="#99A3B0" />
                        </View>
                    </View>

                    {/* Invite Travel Mates */}
                    <TouchableOpacity style={styles.inviteContainer} onPress={() => navigation.navigate('Friends')}>
                        <View style={styles.inviteTextCol}>
                            <Text style={styles.inviteTitle}>Invite Travel Mates</Text>
                            <Text style={styles.inviteDesc}>Planning is better together</Text>
                        </View>
                        <View style={styles.avatarsContainer}>
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=12' }} style={styles.collabAvatar} />
                            <Image source={{ uri: 'https://i.pravatar.cc/100?img=33' }} style={[styles.collabAvatar, { marginLeft: -12 }]} />
                            <View style={[styles.addMateBtn, { marginLeft: -12 }]}>
                                <Ionicons name="add" size={16} color="#111" />
                            </View>
                        </View>
                    </TouchableOpacity>
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.continueBtn, isUploading && { opacity: 0.6 }]}
                        onPress={handleContinue}
                        disabled={isUploading}
                    >
                        <Text style={styles.continueBtnText}>Continue to Dates</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: '#FFF' },
    closeBtn: { padding: 5 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#114C5A' },
    headerAvatar: { width: 36, height: 36, borderRadius: 18 },
    scrollContent: { padding: 24, paddingBottom: 100 },
    stepText: { fontSize: 12, fontWeight: 'bold', color: '#8A94A6', letterSpacing: 1.5, marginBottom: 8 },
    mainTitle: { fontSize: 34, fontWeight: '900', color: '#111827', marginBottom: 10 },
    subtext: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 30 },
    coverContainer: { marginBottom: 40, position: 'relative' },
    coverPlaceholder: { backgroundColor: '#5A6A75', height: 200, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    addCoverBtn: { backgroundColor: 'rgba(232, 241, 245, 0.9)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
    addCoverText: { color: '#114C5A', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
    inputSection: { marginBottom: 30 },
    inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', letterSpacing: 1, marginBottom: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F4F8', borderRadius: 16, paddingHorizontal: 16, height: 60 },
    textInput: { flex: 1, fontSize: 16, color: '#111827' },
    inviteContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F4F8', borderRadius: 24, padding: 20 },
    inviteTextCol: { flex: 1 },
    inviteTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    inviteDesc: { fontSize: 13, color: '#6B7280' },
    avatarsContainer: { flexDirection: 'row', alignItems: 'center' },
    collabAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: '#F0F4F8' },
    addMateBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#B5EAF4', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F0F4F8' },
    footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 24, paddingTop: 10, backgroundColor: '#F8F9FB' },
    continueBtn: { backgroundColor: '#1E7585', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', shadowColor: '#1E7585', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
    continueBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 }
});