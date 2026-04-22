import React, { useState, useEffect } from 'react';
import {
    StyleSheet, View, Text, TextInput, Image, TouchableOpacity,
    ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { db, auth } from "../services/firebase";
import {
    collection, query, where, getDocs, doc,
    updateDoc, addDoc, serverTimestamp, onSnapshot, arrayUnion, limit, deleteDoc
} from "firebase/firestore";

export default function DiscoverScreen() {
    const navigation = useNavigation<any>();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [sentRequestIds, setSentRequestIds] = useState<string[]>([]); // Danh sách ID đã gửi lời mời

    const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [currentUserData, setCurrentUserData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const user = auth.currentUser;

    useEffect(() => {
        if (!user) return;

        // 1. LẤY TỌA ĐỘ VÀ CẬP NHẬT TRẠNG THÁI
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                let location = await Location.getCurrentPositionAsync({});
                const coords = { lat: location.coords.latitude, lng: location.coords.longitude };
                setMyLocation(coords);
                await updateDoc(doc(db, "users", user.uid), coords);
            }
        })();

        // 2. LẮNG NGHE DỮ LIỆU CÁ NHÂN
        const unsubMine = onSnapshot(doc(db, "users", user.uid), (doc) => {
            if (doc.exists()) setCurrentUserData(doc.data());
        });

        // 3. LẮNG NGHE LỜI MỜI ĐẾN (Để hiển thị mục Chấp nhận/Từ chối)
        const qReq = query(collection(db, "friendRequests"), where("toId", "==", user.uid), where("status", "==", "pending"));
        const unsubReq = onSnapshot(qReq, (snap) => {
            setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // 4. LẮNG NGHE LỜI MỜI ĐÃ GỬI (Để đổi trạng thái nút thành "Đã gửi")
        const qSent = query(collection(db, "friendRequests"), where("fromId", "==", user.uid), where("status", "==", "pending"));
        const unsubSent = onSnapshot(qSent, (snap) => {
            setSentRequestIds(snap.docs.map(d => d.data().toId));
        });

        // 5. LẤY GỢI Ý NGƯỜI DÙNG XUNG QUANH
        const fetchSuggestions = async () => {
            const q = query(collection(db, "users"), where("lat", "!=", null), limit(10));
            const snap = await getDocs(q);
            const list = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(u => u.id !== user.uid);
            setSuggestedUsers(list);
        };
        fetchSuggestions();

        return () => { unsubMine(); unsubReq(); unsubSent(); };
    }, [user?.uid]);

    // HÀM TÍNH KHOẢNG CÁCH
    const getDistanceText = (otherLat: number, otherLng: number) => {
        if (!myLocation || !otherLat || !otherLng) return "Xa";
        const R = 6371;
        const dLat = (otherLat - myLocation.lat) * (Math.PI / 180);
        const dLon = (otherLng - myLocation.lng) * (Math.PI / 180);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(myLocation.lat * (Math.PI / 180)) * Math.cos(otherLat * (Math.PI / 180)) * Math.sin(dLon / 2) ** 2;
        const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return d < 1 ? `${(d * 1000).toFixed(0)}m` : `${d.toFixed(1)}km`;
    };

    // TÌM KIẾM
    const handleSearch = async (text: string) => {
        setSearchQuery(text);
        if (text.length < 1) { setSearchResults([]); return; }
        setLoading(true);
        try {
            const qName = query(collection(db, "users"), where("name", ">=", text), where("name", "<=", text + '\uf8ff'));
            const snap = await getDocs(qName);
            setSearchResults(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(u => u.id !== user?.uid));
        } catch (e) { console.log(e); }
        setLoading(false);
    };

    // GỬI LỜI MỜI
    const handleSendRequest = async (target: any) => {
        if (isSending || !currentUserData) return;
        try {
            setIsSending(true);
            await addDoc(collection(db, "friendRequests"), {
                fromId: user!.uid, fromName: currentUserData.name, fromAvatar: currentUserData.avatar || "",
                toId: target.id, status: "pending", createdAt: serverTimestamp()
            });

        } catch (e) { Alert.alert("Lỗi", "Không thể gửi."); }
        finally { setIsSending(false); }
    };

    // ĐỒNG Ý
    const handleAccept = async (req: any) => {
        try {
            const myUid = auth.currentUser?.uid;
            const friendUid = req.fromId; // ID của người gửi lời mời

            if (!myUid || !friendUid) return;

            // Cập nhật trạng thái lời mời
            await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });

            // Cập nhật cho cả 2 bên
            await updateDoc(doc(db, "users", myUid), { friends: arrayUnion(friendUid) });
            await updateDoc(doc(db, "users", friendUid), { friends: arrayUnion(myUid) });


        } catch (e: any) {
            console.log("Lỗi cụ thể:", e.message);
            Alert.alert("Lỗi", "Vui lòng kiểm tra Rules trên Firebase Console");
        }
    };

    // TỪ CHỐI LỜI MỜI (Xóa bản ghi)
    const handleDecline = async (requestId: string) => {
        Alert.alert("Từ chối", "Bạn muốn xóa lời mời này?", [
            { text: "Hủy", style: "cancel" },
            {
                text: "Từ chối", style: "destructive", onPress: async () => {
                    try {
                        await deleteDoc(doc(db, "friendRequests", requestId));
                    } catch (e) { Alert.alert("Lỗi", "Không thể xóa."); }
                }
            }
        ]);
    };

    const renderUser = (item: any, isIncomingReq = false) => {
        const isSent = sentRequestIds.includes(item.id);
        const isFriend = currentUserData?.friends?.includes(item.id);

        return (
            <View style={styles.userCard} key={item.id}>
                <Image source={{ uri: item.avatar || item.fromAvatar || 'https://via.placeholder.com/100' }} style={styles.avatar} />
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name || item.fromName}</Text>
                    {!isIncomingReq && (
                        <Text style={styles.distanceText}>
                            <Ionicons name="location-sharp" size={12} /> {getDistanceText(item.lat, item.lng)}
                        </Text>
                    )}
                </View>

                {isIncomingReq ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => handleDecline(item.id)}>
                            <Text style={styles.btnTextWhite}>Xóa
                                <Ionicons name="close" size={20} color="#666" />
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item)}>
                            <Text style={styles.btnTextWhite}>Đồng ý</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.addBtn, (isSent || isFriend) && { backgroundColor: '#F0F0F0' }]}
                        onPress={() => !(isSent || isFriend) && handleSendRequest(item)}
                        disabled={isSent || isFriend}
                    >
                        <Text style={{ color: (isSent || isFriend) ? '#999' : '#4fd1c5', fontWeight: 'bold' }}>
                            {isFriend ? "Bạn bè" : isSent ? "Đã gửi" : "Kết bạn"}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={{ paddingHorizontal: 20, marginTop: 15 }}>
                <TouchableOpacity
                    style={{ backgroundColor: '#196163', padding: 15, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}
                    onPress={() => navigation.navigate('TripPlanner')}
                >
                    <Ionicons name="map" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Digital Concierge / Trip Planner</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchHeader}>
                <Ionicons name="search" size={20} color="#999" />
                <TextInput style={styles.input} placeholder="Tìm bạn mới..." value={searchQuery} onChangeText={handleSearch} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
                {incomingRequests.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Lời mời kết bạn</Text>
                        {incomingRequests.map(req => renderUser(req, true))}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{searchQuery ? "Kết quả" : "Gợi ý xung quanh"}</Text>
                    {loading ? <ActivityIndicator color="#4fd1c5" /> : (
                        searchQuery ? searchResults.map(u => renderUser(u)) : suggestedUsers.map(u => renderUser(u))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    searchHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', margin: 20, paddingHorizontal: 15, borderRadius: 20, height: 50 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    content: { paddingHorizontal: 20 },
    section: { marginBottom: 25 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    avatar: { width: 55, height: 55, borderRadius: 27.5, backgroundColor: '#EEE' },
    userInfo: { flex: 1, marginLeft: 15 },
    userName: { fontSize: 16, fontWeight: 'bold' },
    distanceText: { fontSize: 13, color: '#4fd1c5', marginTop: 3 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    addBtn: { backgroundColor: '#F0F9FA', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 15 },
    acceptBtn: { backgroundColor: '#4fd1c5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 15, marginLeft: 8 },
    declineBtn: { backgroundColor: '#F5F5F5', padding: 8, borderRadius: 15 },
    btnTextWhite: { color: '#FFF', fontWeight: 'bold' }
});