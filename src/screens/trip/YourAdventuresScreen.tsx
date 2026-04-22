import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, TextInput, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

// --- Redux Imports ---
import { useDispatch, useSelector } from 'react-redux';
import { fetchTrips } from '../../store/slices/tripSlice';
import { RootState, AppDispatch } from '../../store';

export default function YourAdventuresScreen() {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch<AppDispatch>();

    // State Local
    const [avatar, setAvatar] = useState('https://i.pravatar.cc/100?img=11');
    const [refreshing, setRefreshing] = useState(false);

    // State Redux
    const { info } = useSelector((state: RootState) => state.user);
    const { trips, loading } = useSelector((state: RootState) => state.trips);

    // Lắng nghe Avatar thay đổi
    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
            if (docSnap.exists() && docSnap.data().avatar) {
                setAvatar(docSnap.data().avatar);
            }
        });
        return () => unsub();
    }, []);

    // Tải danh sách chuyến đi khi component mount
    useEffect(() => {
        if (info?.uid) {
            dispatch(fetchTrips(info.uid));
        }
    }, [info?.uid, dispatch]);

    // Hàm kéo để tải lại (Pull to refresh)
    const onRefresh = async () => {
        setRefreshing(true);
        if (info?.uid) {
            await dispatch(fetchTrips(info.uid));
        }
        setRefreshing(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#114C5A']} />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="menu" size={28} color="#114C5A" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>The Digital Concierge</Text>
                    <Image source={{ uri: avatar }} style={{ width: 32, height: 32, borderRadius: 16 }} />
                </View>

                <Text style={styles.title}>Your adventures curated.</Text>
                <Text style={styles.desc}>Experience travel without the friction. Manage your upcoming journeys and revisit memories from past explorations.</Text>

                {/* --- UPCOMING ADVENTURES --- */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Adventures</Text>
                    <TouchableOpacity style={styles.planNewBtn} onPress={() => navigation.navigate('CreateExplorePlaces')}>
                        <Text style={styles.planNewText}>Plan New</Text>
                        <Ionicons name="add-circle" size={25} style={{ paddingRight: 5 }} color="#114C5A" />
                    </TouchableOpacity>
                </View>

                {/* Render Dữ Liệu Thật Từ Firebase */}
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#114C5A" style={{ marginVertical: 20 }} />
                ) : trips.length > 0 ? (
                    trips.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.tripCard}
                            onPress={() => navigation.navigate('Itinerary')}
                        >
                            <Image
                                source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800' }}
                                style={styles.tripImg}
                            />
                            <Text style={styles.tripDate}>
                                {item.startDate} - {item.endDate}
                            </Text>
                            <Text style={styles.tripTitle}>{item.title}</Text>
                            <Text style={styles.tripDesc}>{item.region} · {item.isPrivate ? 'Private Trip' : 'Shared Trip'}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={{ alignItems: 'center', marginVertical: 30 }}>
                        <Ionicons name="airplane-outline" size={40} color="#D1D5DB" />
                        <Text style={{ color: '#666', marginTop: 10 }}>No adventures yet. Start planning one!</Text>
                    </View>
                )}

                {/* --- PAST TRIPS (Giữ làm Placeholder tạm) --- */}
                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Past Trips</Text>
                    <Text style={{ fontSize: 12, color: '#666' }}>View Archive <Ionicons name="folder-open-outline" size={12} /></Text>
                </View>

                <View style={styles.tripCard}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1508873696983-2dfd5898f08b?q=80&w=800' }} style={styles.tripImg} />
                    <Text style={styles.tripDate}>JUNE 2023</Text>
                    <Text style={styles.tripTitle}>Yosemite Wilderness</Text>
                    <Text style={styles.tripDesc}>8 days · 4 Friends</Text>
                </View>

                <View style={[styles.tripCard, { marginBottom: 100 }]}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1493904443152-192ac7c6dfb4?q=80&w=800' }} style={styles.tripImg} />
                    <Text style={styles.tripDate}>NOVEMBER 2022</Text>
                    <Text style={styles.tripTitle}>Kyoto Temple Trail</Text>
                    <Text style={styles.tripDesc}>12 days · 2 Friends</Text>
                </View>
            </ScrollView>

            {/* Bottom Search Bar */}
            <View style={styles.bottomSearchContainer}>
                <View style={styles.bottomSearchBox}>
                    <Ionicons name="search" size={18} color="#114C5A" />
                    <TextInput placeholder="Search for your next destination..." style={styles.bottomSearchInput} placeholderTextColor="#666" />
                    <TouchableOpacity style={styles.bottomSearchBtn}>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FB' },
    content: { padding: 20, paddingTop: 50 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#114C5A' },
    title: { fontSize: 36, fontWeight: '900', color: '#111', lineHeight: 40, marginBottom: 15 },
    desc: { color: '#666', fontSize: 14, marginBottom: 30, lineHeight: 22 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    planNewBtn: { flexDirection: 'row', borderRadius: 45, backgroundColor: '#d3f7f5ff', alignItems: 'center' },
    planNewText: { fontSize: 12, padding: 10, paddingRight: 5, fontWeight: 'bold', color: '#114C5A', textAlign: 'right' },
    tripCard: { backgroundColor: '#FFF', padding: 15, borderRadius: 24, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    tripImg: { width: '100%', height: 160, borderRadius: 16, marginBottom: 15 },
    tripDate: { fontSize: 10, fontWeight: 'bold', color: '#114C5A', marginBottom: 5, letterSpacing: 1, textTransform: 'uppercase' },
    tripTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 5 },
    tripDesc: { fontSize: 12, color: '#666' },
    bottomSearchContainer: { position: 'absolute', bottom: 20, left: 20, right: 20 },
    bottomSearchBox: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 30, paddingLeft: 20, paddingRight: 5, paddingVertical: 5, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, elevation: 10 },
    bottomSearchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#111', height: 40 },
    bottomSearchBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#114C5A', justifyContent: 'center', alignItems: 'center' }
});