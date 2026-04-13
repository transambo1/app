import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet, View, Text, Image, TouchableOpacity, FlatList,
  Dimensions, Modal, TextInput, Alert, ActivityIndicator,
  Animated, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { clearUser } from '../store/slices/userSlice';
import { clearFriends } from '../store/slices/friendSlice';
import { auth, db } from "../services/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, deleteDoc } from "firebase/firestore";
import * as ImagePicker from 'expo-image-picker';
import { BlurView } from 'expo-blur';
import { uploadToCloudinary } from '../services/cloudinary';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const userRedux = useSelector((state: RootState) => state.user.info);

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quản lý Modal
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [selectedMapGroup, setSelectedMapGroup] = useState<any[]>([]);
  const [isSettingsVisible, setSettingsVisible] = useState(false);

  const [newName, setNewName] = useState(userRedux?.name || '');
  const [newBio, setNewBio] = useState(userRedux?.bio || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const zoomAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (!userRedux?.uid) return;
    const q = query(
      collection(db, "posts"),
      where("senderId", "==", userRedux.uid),
      orderBy("createdAt", "desc")
    );
    const unsubPosts = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(data);
      setLoading(false);
    });
    return () => unsubPosts();
  }, [userRedux?.uid]);

  const mapMarkers = useMemo(() => {
    const groups: Record<string, any> = {};
    posts.forEach(post => {
      if (!post.lat || !post.lng) return;
      const key = `${post.lat.toFixed(4)}-${post.lng.toFixed(4)}`;
      if (!groups[key]) {
        groups[key] = { id: key, lat: post.lat, lng: post.lng, posts: [post] };
      } else {
        groups[key].posts.push(post);
      }
    });
    return Object.values(groups);
  }, [posts]);

  // Hiệu ứng zoom cho modal ảnh đơn
  useEffect(() => {
    if (selectedPost) {
      Animated.spring(zoomAnim, { toValue: 1, useNativeDriver: true, friction: 8 }).start();
    } else {
      zoomAnim.setValue(0.8);
    }
  }, [selectedPost]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    return timestamp.toDate().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
  };

  const handleChangeAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Lỗi", "Cần quyền truy cập thư viện ảnh để đổi ảnh đại diện.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        const selectedUri = result.assets[0].uri;
        setLocalAvatar(selectedUri);
        handleAvatarUpload(selectedUri);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh.");
    }
  };

  const handleAvatarUpload = async (uri: string) => {
    setIsUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(uri);
      if (imageUrl && userRedux?.uid) {
        await updateDoc(doc(db, "users", userRedux.uid), { avatar: imageUrl });
      } else {
        throw new Error("Không nhận được URL từ máy chủ.");
      }
    } catch (error) {
      console.log("Lỗi tải ảnh đại diện:", error);
      Alert.alert("Lỗi", "Không thể tải ảnh đại diện lên máy chủ. Vui lòng thử lại sau.");
      setLocalAvatar(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!newName.trim()) {
      Alert.alert("Lỗi", "Tên hiển thị không được để trống!");
      return;
    }
    setIsUpdatingProfile(true);
    try {
      if (userRedux?.uid) {
        await updateDoc(doc(db, "users", userRedux.uid), {
          name: newName.trim(),
          bio: newBio.trim()
        });
        setSettingsVisible(false);
      }
    } catch (error) {
      Alert.alert("Lỗi", "Mạng không ổn định, không thể lưu thay đổi.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert("Xóa Moment", "Bạn có chắn chắn muốn xóa?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa", style: "destructive", onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
            setSelectedPost(null);
            if (selectedMapGroup.length > 0) {
              const newGroup = selectedMapGroup.filter(p => p.id !== postId);
              if (newGroup.length === 0) setSelectedMapGroup([]);
              else setSelectedMapGroup(newGroup);
            }
          } catch (e) { Alert.alert("Lỗi", "Không thể xóa ảnh."); }
        }
      }
    ]);
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn thoát tài khoản không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await auth.signOut();
            dispatch(clearUser());
            dispatch(clearFriends());
            setSettingsVisible(false);
          } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng kiểm tra lại mạng.");
          }
        }
      }
    ]);
  };

  // HEADER CỐ ĐỊNH, DÙNG CHUNG KHÔNG BỊ GIẬT
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handleChangeAvatar} disabled={isUploading}>
          <View style={styles.avatarWrapper}>
            <Image source={{ uri: localAvatar || userRedux?.avatar || 'https://via.placeholder.com/150' }} style={[styles.avatar, isUploading && { opacity: 0.6 }]} />
            {isUploading ? <ActivityIndicator style={styles.absoluteCenter} color="#000" /> : <View style={styles.cameraIconBadge}><Ionicons name="camera" size={14} color="white" /></View>}
          </View>
        </TouchableOpacity>
        <Text style={styles.nameText}>{userRedux?.name}</Text>
        <Text style={styles.handleText}>{posts.length} Memories</Text>
        <Text style={styles.bioText}>{userRedux?.bio || "Chưa có tiểu sử."}</Text>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tabBtn, viewMode !== 'map' && styles.tabActive]} onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          <Ionicons name={viewMode === 'list' ? "list" : "grid"} size={18} color="black" />
          <Text style={styles.tabLabel}>{viewMode === 'list' ? "List" : "Grid"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, viewMode === 'map' && styles.tabActive]} onPress={() => setViewMode('map')}>
          <Ionicons name="map" size={18} color="black" />
          <Text style={styles.tabLabel}>Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Archive</Text>
        <TouchableOpacity onPress={() => setSettingsVisible(true)}>
          <Ionicons name="settings-outline" size={26} color="black" />
        </TouchableOpacity>
      </View>

      {viewMode === 'map' ? (
        <View style={{ flex: 1 }}>
          {renderHeader()}
          <View style={styles.mapWrapper}>
            <MapView style={styles.map} initialRegion={{
              latitude: posts[0]?.lat || 10.7626, longitude: posts[0]?.lng || 106.6601,
              latitudeDelta: 0.1, longitudeDelta: 0.1,
            }}>
              {mapMarkers.map((marker, idx) => (
                <Marker key={idx} coordinate={{ latitude: marker.lat, longitude: marker.lng }} onPress={() => {
                  if (marker.posts.length === 1) {
                    setSelectedPost(marker.posts[0]);
                  } else {
                    setSelectedMapGroup(marker.posts);
                  }
                }}>
                  <View style={styles.markerContainer}>
                    {marker.posts.length > 1 && <View style={styles.markerStack1} />}
                    {marker.posts.length > 2 && <View style={styles.markerStack2} />}

                    <View style={styles.customMarker}>
                      <Image source={{ uri: marker.posts[0].imageUrl }} style={styles.markerImage} />
                    </View>

                    {marker.posts.length > 1 && (
                      <View style={styles.markerBadgeCircle}>
                        <Text style={styles.markerBadgeText}>{marker.posts.length}</Text>
                      </View>
                    )}
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={posts}
            renderItem={({ item }) => (
              <TouchableOpacity style={viewMode === 'grid' ? styles.gridItem : styles.listItem} onPress={() => setSelectedPost(item)}>
                <Image source={{ uri: item.imageUrl }} style={styles.fullImage} />
              </TouchableOpacity>
            )}
            ListHeaderComponent={renderHeader}
            keyExtractor={item => item.id}
            numColumns={viewMode === 'grid' ? 3 : 1}
            key={viewMode}
            // Đã chỉnh lại khoảng cách từ Header xuống list/grid cho chuẩn
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={loading ? <ActivityIndicator color="#4fd1c5" style={{ marginTop: 40 }} /> : <Text style={styles.emptyText}>Chưa có kỉ niệm nào.</Text>}
          />
        </View>
      )}

      {/* --- MODAL 1: BOTTOM SHEET (XEM NHIỀU ẢNH TRÊN BẢN ĐỒ) --- */}
      <Modal visible={selectedMapGroup.length > 0} animationType="slide" transparent>
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedMapGroup([])} />

          <View style={styles.bottomSheetContent}>
            <View style={styles.dragHandle} />
            <Text style={styles.bottomSheetTitle}>{selectedMapGroup.length} kỉ niệm tại địa điểm này</Text>

            <FlatList
              data={selectedMapGroup}
              numColumns={3}
              keyExtractor={item => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.bottomSheetGridItem} onPress={() => setSelectedPost(item)}>
                  <Image source={{ uri: item.imageUrl }} style={styles.fullImage} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* --- MODAL 2: CHI TIẾT 1 ẢNH (ZOOM) --- */}
      <Modal visible={!!selectedPost} transparent animationType="fade">
        <BlurView intensity={70} style={styles.modalOverlay} tint="dark">
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedPost(null)} activeOpacity={1} />

          <Animated.View style={[styles.detailCard, { transform: [{ scale: zoomAnim }] }]} pointerEvents="box-none">
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <Image source={{ uri: selectedPost?.imageUrl }} style={styles.detailImage} resizeMode="contain" />

              <View style={styles.imageOverlay}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailCaption} numberOfLines={2}>{selectedPost?.caption || "Kỉ niệm đẹp"}</Text>
                  <Text style={styles.detailTime}>{formatTime(selectedPost?.createdAt)}</Text>
                  {(selectedPost?.likes?.length || 0) > 0 && (
                    <Text style={styles.likeCountText}>❤️ {selectedPost.likes.length} người đã thả tim</Text>
                  )}
                </View>

                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeletePost(selectedPost?.id)}>
                  <Ionicons name="trash-outline" size={22} color="#ff4757" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </Modal>

      {/* --- MODAL 3: SETTINGS PROFILE --- */}
      <Modal visible={isSettingsVisible} animationType="slide" transparent>
        {/* Đẩy toàn bộ giao diện lên khi bàn phím xuất hiện */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.settingsOverlay}>

            {/* 1. Chạm ra vùng tối bên ngoài: Hạ bàn phím và Đóng bảng */}
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                setSettingsVisible(false);
              }}
            />

            {/* 2. Chạm vào khoảng trắng bên trong bảng: Chỉ hạ bàn phím */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.settingsContent}>
                <View style={styles.dragHandle} />
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
                  <TouchableOpacity onPress={() => { Keyboard.dismiss(); setSettingsVisible(false); }}>
                    <View style={styles.closeBtnIcon}><Ionicons name="close" size={20} color="#666" /></View>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>TÊN HIỂN THỊ</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nhập tên của bạn..."
                  placeholderTextColor="#aaa"
                />

                <Text style={styles.inputLabel}>TIỂU SỬ (BIO)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newBio}
                  onChangeText={setNewBio}
                  placeholder="Viết gì đó thú vị về bạn..."
                  multiline
                  maxLength={60}
                />

                <TouchableOpacity style={[styles.saveBtn, isUpdatingProfile && { opacity: 0.7 }]} onPress={handleUpdateProfile} disabled={isUpdatingProfile}>
                  {isUpdatingProfile ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Lưu thay đổi</Text>}
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                  <Text style={styles.logoutBtnText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 5, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },

  // FIXED: Chiều cao và khoảng cách Header cố định
  headerContainer: { paddingBottom: 15, backgroundColor: '#fff', zIndex: 10 },
  profileSection: { alignItems: 'center', marginVertical: 5 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee' },
  absoluteCenter: { position: 'absolute', top: 35, left: 35 },
  cameraIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#000', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  nameText: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  handleText: { color: '#666', marginTop: 3, fontWeight: '600', fontSize: 13 },
  bioText: { color: '#888', textAlign: 'center', paddingHorizontal: 40, marginTop: 8, lineHeight: 20, fontSize: 14 },

  tabBar: { flexDirection: 'row', backgroundColor: '#f0f0f0', marginHorizontal: 40, marginTop: 15, borderRadius: 25, padding: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 20 },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  tabLabel: { color: '#333', marginLeft: 6, fontSize: 13, fontWeight: '600' },

  // FIXED: Khoảng cách từ Tab xuống Grid/List
  listContainer: { paddingBottom: 100 },

  // CHỈNH LẠI GRID CHO ĐỀU (Padding trái phải để không sát viền đt)
  gridItem: { width: (SCREEN_WIDTH / 3) - 2, aspectRatio: 1, margin: 1, backgroundColor: '#eee', borderRadius: 14, position: 'relative', overflow: 'hidden' },
  bottomSheetGridItem: { width: (SCREEN_WIDTH / 3) - 4, aspectRatio: 1, margin: 1, backgroundColor: '#eee', borderRadius: 8, overflow: 'hidden' },

  // LIST CÓ THÊM KHOẢNG CÁCH TRÊN (marginTop) ĐỂ TÁCH KHỎI TAB BAR
  listItem: { width: SCREEN_WIDTH - 25, aspectRatio: 3 / 4, alignSelf: 'center', marginTop: 15, borderRadius: 20, overflow: 'hidden' },
  fullImage: { width: '100%', height: '100%' },

  // BẢN ĐỒ CÓ THÊM MARGIN TOP ĐỂ TÁCH KHỎI TAB BAR
  mapWrapper: { flex: 1, borderRadius: 20, overflow: 'hidden', marginHorizontal: 15, marginBottom: 140 },
  map: { flex: 1 },

  // STACK MARKER DESIGN (Xếp chồng rõ ràng hơn)
  markerContainer: { alignItems: 'center', justifyContent: 'center', width: 65, height: 65 },
  markerStack1: { position: 'absolute', width: 46, height: 46, backgroundColor: '#f0f0f0', borderRadius: 12, borderWidth: 2, borderColor: '#fff', transform: [{ rotate: '15deg' }, { translateX: 3 }, { translateY: 3 }] },
  markerStack2: { position: 'absolute', width: 48, height: 48, backgroundColor: '#e0e0e0', borderRadius: 12, borderWidth: 2, borderColor: '#fff', transform: [{ rotate: '-12deg' }, { translateX: -2 }, { translateY: 2 }] },
  customMarker: { width: 45, height: 45, borderRadius: 12, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', backgroundColor: '#eee', zIndex: 2 },
  markerImage: { width: '100%', height: '100%' },

  // BADGE SỐ LƯỢNG MỚI (Tròn đỏ nằm góc trên bên phải)
  markerBadgeCircle: { position: 'absolute', top: -2, right: -2, backgroundColor: '#ff4757', width: 25, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
  markerBadgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },

  // --- DETAIL MODAL ZOOM (ĐÃ FIX SIZE & CLICK) ---
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detailCard: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.69,
    // Thu nhỏ lại cho vừa vặn, dễ bấm ra ngoài
    backgroundColor: 'transparent',
    borderRadius: 40,
    overflow: 'hidden',
    justifyContent: 'center'
  },
  detailImage: { width: '100%', height: '100%' },
  imageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20, paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
  },
  detailCaption: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  detailTime: { color: '#ccc', fontSize: 12, fontWeight: '500' },
  likeCountText: { color: '#ff4757', fontSize: 13, marginTop: 4, fontWeight: 'bold' },
  deleteBtn: { backgroundColor: 'rgba(255, 71, 87, 0.25)', padding: 12, borderRadius: 20, marginLeft: 15 },

  // --- BOTTOM SHEET XEM NHIỀU ẢNH Ở MAP ---
  bottomSheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  bottomSheetContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingVertical: 15, paddingHorizontal: 5, height: SCREEN_HEIGHT * 0.6 },
  bottomSheetTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },

  // --- SETTINGS ---
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  settingsContent: { backgroundColor: '#fff', padding: 25, paddingTop: 15, borderTopLeftRadius: 35, borderTopRightRadius: 35, paddingBottom: Platform.OS === 'ios' ? 40 : 25 },
  dragHandle: { width: 40, height: 5, backgroundColor: '#ddd', borderRadius: 3, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#111', marginTop: 5 },
  closeBtnIcon: { backgroundColor: '#f0f0f0', padding: 6, borderRadius: 15 },
  inputLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', marginTop: 15, marginLeft: 4, letterSpacing: 1 },
  input: { backgroundColor: '#f8f9fa', padding: 16, borderRadius: 16, marginTop: 8, fontSize: 16, borderWidth: 1, borderColor: '#eee', color: '#333' },
  textArea: { height: 90, paddingTop: 16, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#4fd1c5', padding: 18, borderRadius: 20, alignItems: 'center', marginTop: 30 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { padding: 15, alignItems: 'center', marginTop: 15 },
  logoutBtnText: { color: '#ff4757', fontWeight: 'bold', fontSize: 15 },
});