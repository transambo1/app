import React, { useState, useRef, useCallback } from 'react';
import {
    StyleSheet, Text, View, TouchableOpacity, Alert,
    ActivityIndicator, Dimensions, TextInput, KeyboardAvoidingView, Platform, Image,
    FlatList, Modal, LayoutAnimation, UIManager, ScrollView, StatusBar, PanResponder, Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { auth, db } from "../services/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { uploadToCloudinary } from "../services/cloudinary";
import { getUserNameById } from "../services/user";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- COMPONENT TAG DI CHUYỂN ĐƯỢC ---
const DraggableTag = ({ name, onTouchStart, onTouchEnd, onUpdatePos }: any) => {
    const pan = useRef(new Animated.ValueXY()).current;
    const lastOffset = useRef({ x: 0, y: 0 });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onTouchStart();
                pan.setOffset({ x: lastOffset.current.x, y: lastOffset.current.y });
                pan.setValue({ x: 0, y: 0 });
            },
            // FIX LỖI LN 48: Cung cấp đầy đủ tham số cho Animated.event
            onPanResponderMove: (event, gestureState) => {
                return Animated.event(
                    [null, { dx: pan.x, dy: pan.y }],
                    { useNativeDriver: false }
                )(event, gestureState);
            },
            onPanResponderRelease: () => {
                pan.flattenOffset();
                onTouchEnd();
                // @ts-ignore
                const currentPos = { x: pan.x._value, y: pan.y._value };
                lastOffset.current = currentPos;
                onUpdatePos(currentPos);
            },
        })
    ).current;

    return (
        <Animated.View
            style={[styles.draggableTag, { transform: [{ translateX: pan.x }, { translateY: pan.y }] }]}
            {...panResponder.panHandlers}
        >
            <Text style={styles.imageTagText}>@{name}</Text>
        </Animated.View>
    );
};

export default function CameraScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [locationName, setLocationName] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facing, setFacing] = useState<'front' | 'back'>('back');
    const [flash, setFlash] = useState<'off' | 'on'>('off');
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

    const [isScrollEnabled, setIsScrollEnabled] = useState(true);
    const [isTagModalVisible, setTagModalVisible] = useState(false);
    const [taggedFriends, setTaggedFriends] = useState<any[]>([]);

    const friends = useSelector((state: RootState) => state.friends.list);
    const cameraRef = useRef<any>(null);

    const toggleTagFriend = useCallback((friend: any) => {
        setTaggedFriends(prev => {
            const isExist = prev.find(f => f.uid === friend.uid);
            if (isExist) return prev.filter(f => f.uid !== friend.uid);
            return [...prev, { ...friend, posX: 0, posY: 0 }];
        });
    }, []);

    const updateTagPosition = (uid: string, pos: { x: number, y: number }) => {
        setTaggedFriends(prev => prev.map(f => f.uid === uid ? { ...f, posX: pos.x, posY: pos.y } : f));
    };

    const handleLocation = async () => {
        if (locationName || coords) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setLocationName('');
            setCoords(null);
            return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return Alert.alert("Lỗi", "Cần quyền vị trí");
        try {
            const location = await Location.getCurrentPositionAsync({});
            setCoords({ lat: location.coords.latitude, lng: location.coords.longitude });
            const address = await Location.reverseGeocodeAsync(location.coords);
            if (address[0]) setLocationName(`${address[0].district || address[0].name}, ${address[0].city}`);
        } catch (e) { Alert.alert("Lỗi", "Không thể lấy vị trí"); }
    };

    const handleFinalShare = async () => {
        const user = auth.currentUser;
        if (!user || !capturedImage || uploading) return;
        try {
            setUploading(true);
            const [imageUrl, name] = await Promise.all([
                uploadToCloudinary(capturedImage),
                getUserNameById(user.uid)
            ]);
            if (imageUrl) {
                await addDoc(collection(db, "posts"), {
                    imageUrl,
                    senderId: user.uid,
                    senderName: name,
                    caption: caption.trim(),
                    location: locationName,
                    lat: coords?.lat || null,
                    lng: coords?.lng || null,
                    taggedFriends: taggedFriends.map(f => ({ uid: f.uid, name: f.name, posX: f.posX || 0, posY: f.posY || 0 })),
                    likedBy: [],
                    createdAt: serverTimestamp(),
                });
                setCapturedImage(null);
                setCaption('');
                setLocationName('');
                setTaggedFriends([]);
                navigation.navigate('Home');
            }
        } catch (e) { Alert.alert("Lỗi", "Không thể chia sẻ"); } finally { setUploading(false); }
    };

    if (!permission?.granted) return (
        <View style={styles.center}><TouchableOpacity style={styles.btnPerm} onPress={requestPermission}><Text style={styles.btnPermText}>Cấp quyền Camera</Text></TouchableOpacity></View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => capturedImage ? setCapturedImage(null) : navigation.goBack()}>
                    <Ionicons name={capturedImage ? "chevron-back" : "close"} size={28} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{capturedImage ? "Edit Moment" : "Take Photo"}</Text>
                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody} scrollEnabled={isScrollEnabled}>
                    <View style={[styles.mediaCard, capturedImage ? styles.mediaCardSmall : styles.mediaCardFull]}>
                        {!capturedImage ? (
                            <CameraView style={styles.media} ref={cameraRef} facing={facing} flash={flash}>
                                {/* FIX LỖI LN 187: camTools & toolIcon đã thêm bên dưới */}
                                <View style={styles.camTools}>
                                    <TouchableOpacity style={styles.toolIcon} onPress={() => setFlash(f => f === 'on' ? 'off' : 'on')}>
                                        <Ionicons name={flash === 'on' ? "flash" : "flash-off"} size={20} color="white" />
                                    </TouchableOpacity>

                                </View>
                            </CameraView>
                        ) : (
                            <View style={styles.media}>
                                <Image source={{ uri: capturedImage }} style={styles.media} />
                                <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                                    {taggedFriends.map((f) => (
                                        <DraggableTag key={f.uid} name={f.name} onTouchStart={() => setIsScrollEnabled(false)} onTouchEnd={() => setIsScrollEnabled(true)} onUpdatePos={(pos: any) => updateTagPosition(f.uid, pos)} />
                                    ))}
                                </View>
                            </View>
                        )}
                        {uploading && <View style={styles.loader}><ActivityIndicator size="large" color="#4fd1c5" /></View>}

                    </View>

                    {capturedImage && (
                        <View style={styles.inputArea}>
                            <Text style={styles.label}>STORY</Text>
                            <TextInput style={styles.captionInput} placeholder="What happened?" placeholderTextColor="#999" multiline value={caption} onChangeText={setCaption} />
                            <View style={styles.badgeRow}>
                                <TouchableOpacity style={[styles.badge, taggedFriends.length > 0 && styles.badgeActive]} onPress={() => setTagModalVisible(true)}>
                                    <Ionicons name="person-add" size={16} color={taggedFriends.length > 0 ? "white" : "#4fd1c5"} />
                                    <Text style={[styles.badgeText, { color: taggedFriends.length > 0 ? "white" : "#333" }]}>Tag friends</Text>
                                    {taggedFriends.length > 0 && <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{taggedFriends.length}</Text>
                                    </View>}
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.badge, locationName ? styles.badgeActive : null, { flex: 1.5 }]} onPress={handleLocation}>
                                    <Ionicons name={locationName ? "location" : "location-outline"} size={16} color={locationName ? "white" : "#4fd1c5"} />
                                    <Text style={[styles.badgeText, { color: locationName ? "white" : "#333" }]} numberOfLines={1}>{locationName || "Location"}</Text>
                                    {locationName ? <Ionicons name="close-circle" size={14} color="white" /> : null}
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {!capturedImage ? (
                    <View style={styles.footerIcons}>

                        <TouchableOpacity style={styles.sideBtn} onPress={async () => {
                            const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5 });
                            if (!res.canceled) setCapturedImage(res.assets[0].uri);
                        }}><Ionicons name="images" size={40} color="#333" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.captureBtn} onPress={async () => {
                            if (cameraRef.current) {
                                const p = await cameraRef.current.takePictureAsync({ quality: 0.5 });
                                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                                setCapturedImage(p.uri);
                            }
                        }}>
                            <View style={styles.captureInner} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toolIcon} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}>
                            <Ionicons name="camera-reverse" size={40} color="white" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={[styles.shareBtn, uploading && { opacity: 0.7 }]} onPress={handleFinalShare} disabled={uploading}>
                        {uploading ? <ActivityIndicator color="white" /> : <><Text style={styles.shareText}>Share Moment</Text><Ionicons name="arrow-forward" size={22} color="white" /></>}
                    </TouchableOpacity>
                )}
            </View>

            <Modal visible={isTagModalVisible} animationType="slide">
                <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: insets.top }}>
                    <View style={styles.modalHeader}>
                        <View style={{ width: 40 }} />
                        <Text style={styles.modalTitle}>Tag Friends</Text>
                        <TouchableOpacity onPress={() => setTagModalVisible(false)}><Text style={styles.doneBtn}>Done</Text></TouchableOpacity>
                    </View>
                    <FlatList
                        data={friends}
                        keyExtractor={(item) => item.uid}
                        renderItem={({ item }) => {
                            const isSelected = taggedFriends.some(f => f.uid === item.uid);
                            return (
                                <TouchableOpacity style={styles.friendItem} onPress={() => toggleTagFriend(item)}>
                                    <Ionicons name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={28} color={isSelected ? "#4fd1c5" : "#ccc"} />
                                    <Image source={{ uri: item.avatar || 'https://via.placeholder.com/150' }} style={styles.friendAvatar} />
                                    <Text style={styles.friendName}>{item.name}</Text>
                                </TouchableOpacity>
                            );
                        }}
                    />
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFF' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
    scrollBody: { paddingBottom: 100 },
    mediaCard: { alignSelf: 'center', borderRadius: 30, overflow: 'hidden', backgroundColor: '#000' },
    mediaCardFull: { width: SCREEN_WIDTH * 0.92, aspectRatio: 1, marginTop: 80 },
    mediaCardSmall: { width: SCREEN_WIDTH * 0.92, aspectRatio: 1, marginTop: 80 },
    media: { flex: 1 },
    draggableTag: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', zIndex: 999 },
    imageTagText: { color: 'white', fontSize: 13, fontWeight: '800' },

    // CÁC STYLE BỊ THIẾU TRONG HÌNH
    camTools: { position: 'absolute', top: 15, right: 15, gap: 12 },
    toolIcon: { backgroundColor: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 40 },
    inputArea: { paddingHorizontal: 25, paddingTop: 15 },
    label: { fontSize: 11, fontWeight: '800', color: '#BBB', marginBottom: 5 },
    captionInput: { fontSize: 20, fontWeight: '700', color: '#333', minHeight: 40 },
    badgeRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
    badge: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5FDFE', padding: 12, borderRadius: 18, gap: 6, justifyContent: 'center' },
    badgeActive: { backgroundColor: '#4fd1c5' },
    badgeText: { fontSize: 12, fontWeight: '700' },
    countBadge: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    countText: { color: '#4fd1c5', fontSize: 10, fontWeight: 'bold' },
    footer: { position: 'absolute', bottom: 0, width: '100%', alignItems: 'center', backgroundColor: '#FFF' },
    footerIcons: { flexDirection: 'row', alignItems: 'center', width: '85%', justifyContent: 'space-between' },
    sideBtn: { width: 60, height: 60, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 30 },
    captureBtn: { width: 75, height: 75, borderRadius: 37.5, borderWidth: 4, borderColor: '#4fd1c5', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#4fd1c5' },
    shareBtn: { width: SCREEN_WIDTH * 0.85, backgroundColor: '#4fd1c5', height: 55, borderRadius: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    shareText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#eee' },
    doneBtn: { color: '#4fd1c5', fontWeight: 'bold', fontSize: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    friendItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderColor: '#f0f0f0', paddingHorizontal: 20 },
    friendAvatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 15, marginLeft: 10 },
    friendName: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
    loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' },
    btnPerm: { backgroundColor: '#4fd1c5', padding: 15, borderRadius: 12 },
    btnPermText: { color: 'white', fontWeight: 'bold' },
    // Ví dụ thêm vào styles

});