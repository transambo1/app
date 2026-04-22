import React, { useState } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
    Image, ScrollView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { createTrip } from '../../store//slices/tripSlice';
import { RootState, AppDispatch } from '../../store';

export default function ReviewAdventureScreen() {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const dispatch = useDispatch<AppDispatch>();

    const { info } = useSelector((state: RootState) => state.user);
    const [isCreating, setIsCreating] = useState(false);

    const { tripName, coverImage, startDate, endDate } = route.params || {};

    const handleCreateAdventure = async () => {
        if (!info?.uid) {
            Alert.alert("Lỗi", "Bạn cần đăng nhập để tạo chuyến đi.");
            return;
        }

        setIsCreating(true);

        // Đóng gói dữ liệu thật từ các màn hình trước
        const newTripData = {
            title: tripName || "New Adventure",
            coverImage: coverImage,
            startDate: startDate,
            endDate: endDate,
            region: "Unknown Destination",
            isPrivate: true,
            userId: info.uid
        };

        const resultAction = await dispatch(createTrip(newTripData));

        if (createTrip.fulfilled.match(resultAction)) {
            // Thành công -> Quay về trang chủ
            navigation.navigate('Adventures');
        } else {
            console.log("CHI TIẾT LỖI FIREBASE:", resultAction.payload);
            Alert.alert("Lỗi", "Tạo chuyến đi thất bại. Vui lòng thử lại.");
        }
        setIsCreating(false);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#114C5A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Digital Concierge</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.progressRow}>
                    <Text style={styles.stepText}>STEP 03</Text>
                    <View style={styles.progressLine} />
                    <Text style={styles.stepTitle}>FINALIZE</Text>
                    <Text style={styles.stepStatus}>3/3 Complete</Text>
                </View>

                <Text style={styles.mainTitle}>Review Your{'\n'}Adventure.</Text>
                <Text style={styles.subtext}>Your itinerary is almost ready. Take a moment to confirm the details of your upcoming journey.</Text>

                {/* THỂ HIỆN DỮ LIỆU THẬT */}
                <View style={styles.card}>
                    <Image source={{ uri: coverImage }} style={styles.heroImg} />
                    <View style={styles.cardPadding}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>OFFICIAL TITLE</Text>
                        </View>
                        <Text style={styles.adventureTitle}>{tripName}</Text>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="calendar-outline" size={24} color="#1E7585" style={{ marginBottom: 10 }} />
                    <Text style={styles.infoLabel}>DURATION</Text>
                    <Text style={styles.infoValue}>{startDate} — {endDate}</Text>
                </View>

                <View style={styles.infoCard}>
                    <Ionicons name="people-outline" size={24} color="#1E7585" style={{ marginBottom: 10 }} />
                    <Text style={styles.infoLabel}>FELLOW EXPLORERS</Text>
                    <View style={styles.avatarsRow}>
                        <Image source={{ uri: 'https://i.pravatar.cc/100?img=11' }} style={styles.avatar} />
                        <View style={[styles.moreAvatar, styles.overlap]}>
                            <Ionicons name="add" size={20} color="#1E7585" />
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.createBtn, isCreating && { opacity: 0.7 }]}
                    onPress={handleCreateAdventure}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.createBtnText}>Create Adventure</Text>
                            <Ionicons name="sparkles" size={18} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.draftBtn}>
                    <Text style={styles.draftBtnText}>Save as Draft</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F8F9FB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 40 : 10, paddingBottom: 15, backgroundColor: '#FFF' },
    backBtn: { padding: 5 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#114C5A' },
    scrollContent: { padding: 24, paddingBottom: 100 },
    progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    stepText: { fontSize: 12, fontWeight: 'bold', color: '#1E7585', letterSpacing: 1 },
    progressLine: { width: 30, height: 1, backgroundColor: '#D1D5DB', marginHorizontal: 10 },
    stepTitle: { fontSize: 12, fontWeight: 'bold', color: '#4B5563', letterSpacing: 1, flex: 1 },
    stepStatus: { fontSize: 11, color: '#4B5563' },
    mainTitle: { fontSize: 36, fontWeight: '900', color: '#114C5A', marginBottom: 10, lineHeight: 40 },
    subtext: { fontSize: 15, color: '#4B5563', lineHeight: 22, marginBottom: 25 },
    card: { backgroundColor: '#FFF', borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
    heroImg: { width: '100%', height: 150 },
    cardPadding: { padding: 20 },
    badge: { backgroundColor: '#B5EAF4', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 10 },
    badgeText: { color: '#1E7585', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
    adventureTitle: { fontSize: 24, fontWeight: 'bold', color: '#111' },
    infoCard: { backgroundColor: '#F0F4F8', padding: 20, borderRadius: 24, marginBottom: 20 },
    infoLabel: { fontSize: 11, fontWeight: 'bold', color: '#6B7280', letterSpacing: 1, marginBottom: 8 },
    infoValue: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 15 },
    avatarsRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: '#F0F4F8' },
    overlap: { marginLeft: -12 },
    moreAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D8F3F1', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F0F4F8' },
    footer: { paddingHorizontal: 24, paddingBottom: Platform.OS === 'ios' ? 20 : 24, paddingTop: 10, backgroundColor: '#F8F9FB' },
    createBtn: { backgroundColor: '#1E7585', height: 60, borderRadius: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    createBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginRight: 10 },
    draftBtn: { alignItems: 'center', paddingVertical: 10 },
    draftBtnText: { color: '#4B5563', fontSize: 14, fontWeight: 'bold' }
});