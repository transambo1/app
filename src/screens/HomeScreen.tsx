import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    StyleSheet, View, Text, Image, FlatList,
    TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { db } from "../services/firebase";
import {
    collection, query, onSnapshot, where,
    doc, updateDoc, arrayUnion, arrayRemove
} from "firebase/firestore";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_HEIGHT = SCREEN_WIDTH + 20;

const PostItem = React.memo(({ item, viewMode, onLike, formatTime, currentUserId, navigation, onPressGrid, friends, userRedux }: any) => {
    const isLiked = item.likes?.includes(currentUserId);
    const likeCount = item.likes?.length || 0; const senderData = friends?.find((f: any) => f.uid === item.senderId);
    const avatarUrl = item.senderId === currentUserId
        ? userRedux?.avatar // Nếu là mình thì lấy avatar của mình (Nhớ truyền userRedux xuống nếu mún xài nhé, hoặc tạm để link ảnh mặc định)
        : senderData?.avatar || 'https://via.placeholder.com/100';

    const renderTagsOnImage = () => {
        if (!item.taggedFriends || item.taggedFriends.length === 0) return null;
        return (
            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {item.taggedFriends.map((f: any) => (
                    <TouchableOpacity
                        key={f.uid}
                        style={[
                            styles.imageTagBadge,
                            { transform: [{ translateX: f.posX || 0 }, { translateY: f.posY || 0 }] }
                        ]}
                        onPress={() => navigation.navigate('Profile', { userId: f.uid })}
                    >
                        <Text style={styles.imageTagText}>@{f.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (viewMode === 'grid') {
        return (
            <TouchableOpacity style={styles.gridItem} onPress={onPressGrid}>
                <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
            </TouchableOpacity>
        );
    }

    return (
        <View style={styles.cardContainer}>
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.imageUrl }} style={styles.mainImage} />
                {renderTagsOnImage()}
                <View style={styles.topOverlay}>
                    <View style={styles.badge}>
                        <Image
                            source={{ uri: avatarUrl }}
                            style={{ width: 20, height: 20, borderRadius: 10, marginRight: 4 }}
                        />
                        <Text style={styles.badgeText}>{item.senderId === currentUserId ? "BẠN" : item.senderName?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.badge}><Text style={styles.badgeText}>{formatTime(item.createdAt)}</Text></View>
                </View>
                <View style={styles.bottomOverlay}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.captionText} numberOfLines={2}>{item.caption || "Moment"}</Text>
                        {likeCount > 0 && <Text style={styles.likeCountText}>❤️ {likeCount} người đã thả tim</Text>}
                    </View>
                    <TouchableOpacity style={[styles.heartButton, isLiked && styles.heartButtonActive]} onPress={() => onLike(item.id, isLiked)}>
                        <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff4757" : "white"} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

export default function HomeScreen({ navigation }: any) {
    const userRedux = useSelector((state: RootState) => state.user.info);
    const friends = useSelector((state: RootState) => state.friends.list);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [selectedFriendId, setSelectedFriendId] = useState<string>('all');

    const listRef = useRef<FlatList>(null);

    // --- ĐÃ SỬA HÀM FETCH POSTS ĐỂ VƯỢT GIỚI HẠN 10 BẠN BÈ ---
    const fetchPosts = useCallback((isRefreshing = false) => {
        if (!userRedux?.uid) return;
        if (isRefreshing) setRefreshing(true);
        else setLoading(true);

        const friendIds = (friends || []).map((f: any) => f.uid || f.id).filter(Boolean);
        // Bỏ cái .slice(0, 30) đi để lấy toàn bộ bạn bè
        const queryIds = selectedFriendId === 'all' ? [userRedux.uid, ...friendIds] : [selectedFriendId];

        if (queryIds.length === 0) {
            setPosts([]);
            setLoading(false);
            setRefreshing(false);
            return () => { };
        }

        // Hàm chặt mảng
        const chunkArray = (array: any[], size: number) => {
            const chunked = [];
            for (let i = 0; i < array.length; i += size) {
                chunked.push(array.slice(i, i + size));
            }
            return chunked;
        };

        const chunks = chunkArray(queryIds, 10);
        const unsubs: any[] = [];

        // Dùng Map để lưu trữ bài viết. Map giúp tự động ghi đè bài cũ bằng bài mới nếu có trùng ID
        const postsMap = new Map();

        chunks.forEach((chunk) => {
            // Lưu ý: Khi xài "in" với chunk, việc dùng chung với orderBy trong Firestore dễ bị lỗi Index.
            // Nên ta sẽ sort dữ liệu trực tiếp ở phía App (bên dưới)
            const q = query(collection(db, "posts"), where("senderId", "in", chunk));

            const unsub = onSnapshot(q, (snap) => {
                // Thêm hoặc cập nhật bài viết mới vào rổ
                snap.docs.forEach(doc => {
                    postsMap.set(doc.id, { id: doc.id, ...doc.data() });
                });

                // Nếu có ai đó xóa bài viết, mình rút nó ra khỏi rổ
                snap.docChanges().forEach(change => {
                    if (change.type === 'removed') {
                        postsMap.delete(change.doc.id);
                    }
                });

                // Chuyển rổ (Map) thành Mảng (Array) và tự sắp xếp giảm dần theo thời gian
                const combinedPosts = Array.from(postsMap.values()).sort((a, b) => {
                    const timeA = a.createdAt?.seconds || 0;
                    const timeB = b.createdAt?.seconds || 0;
                    return timeB - timeA; // Mới nhất lên đầu
                });

                setPosts(combinedPosts);
                setLoading(false);
                setRefreshing(false);
            }, (err) => {
                console.error("Lỗi tải bài viết:", err);
                setLoading(false);
                setRefreshing(false);
            });

            unsubs.push(unsub);
        });

        // Trả về hàm dọn dẹp: Tắt toàn bộ các luồng lắng nghe khi đổi tab
        return () => {
            unsubs.forEach(unsub => unsub());
        };
    }, [selectedFriendId, friends, userRedux?.uid]);

    useEffect(() => {
        const unsub = fetchPosts();
        return () => unsub && unsub();
    }, [fetchPosts]);

    const onRefresh = useCallback(() => {
        fetchPosts(true);
    }, [fetchPosts]);

    const handleGridPress = (index: number) => {
        setViewMode('list');
        setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0 });
        }, 50);
    };

    const handleLike = useCallback(async (postId: string, isLiked: boolean) => {
        if (!userRedux?.uid) return;
        const postRef = doc(db, "posts", postId);
        try {
            await updateDoc(postRef, {
                likes: isLiked ? arrayRemove(userRedux.uid) : arrayUnion(userRedux.uid)
            });
        } catch (e) { console.error(e); }
    }, [userRedux?.uid]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Moments</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
                    <Ionicons name={viewMode === 'list' ? "grid" : "list"} size={22} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.filterWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    <TouchableOpacity style={styles.friendChip} onPress={() => setSelectedFriendId('all')}>
                        <View style={[styles.allAvatar, selectedFriendId === 'all' && styles.activeChip]}>
                            <Ionicons name="apps" size={22} color={selectedFriendId === 'all' ? "#4fd1c5" : "#999"} />
                        </View>
                        <Text style={[styles.friendName, selectedFriendId === 'all' && styles.activeText]}>Mọi người</Text>
                    </TouchableOpacity>
                    {friends.map((friend: any) => (
                        <TouchableOpacity key={friend.uid} style={styles.friendChip} onPress={() => setSelectedFriendId(friend.uid)}>
                            <View style={[styles.avatarBorder, selectedFriendId === friend.uid && styles.activeChip]}>
                                <Image source={{ uri: friend.avatar || 'https://via.placeholder.com/100' }} style={styles.friendAvatar} />
                            </View>
                            <Text style={[styles.friendName, selectedFriendId === friend.uid && styles.activeText]} numberOfLines={1}>{friend.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <ActivityIndicator size="large" color="#4fd1c5" style={{ flex: 1 }} />
            ) : (
                <FlatList
                    ref={listRef}
                    key={viewMode}
                    data={posts}
                    renderItem={({ item, index }) => (
                        <PostItem
                            item={item}
                            viewMode={viewMode}
                            onLike={handleLike}
                            formatTime={(ts: any) => ts?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            currentUserId={userRedux?.uid}
                            navigation={navigation}
                            onPressGrid={() => handleGridPress(index)}
                            friends={friends}
                        />
                    )}
                    numColumns={viewMode === 'grid' ? 3 : 1}
                    keyExtractor={item => item.id}
                    getItemLayout={(data, index) => (
                        { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4fd1c5"]}
                            tintColor={"#4fd1c5"}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    iconBtn: { backgroundColor: '#f8f8f8', padding: 10, borderRadius: 15 },
    filterWrapper: { paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f9f9f9', height: 110, },
    filterScroll: { paddingHorizontal: 18, gap: 18, alignItems: 'center', height: '100%' },
    friendChip: { alignItems: 'center', width: 65 },
    friendAvatar: { width: 60, height: 60, borderRadius: 40 },
    cardContainer: { paddingHorizontal: 15, height: ITEM_HEIGHT, justifyContent: 'center' },
    imageWrapper: { width: '100%', aspectRatio: 1, borderRadius: 40, overflow: 'hidden', backgroundColor: '#f0f0f0' },
    mainImage: { width: '100%', height: '100%' },
    topOverlay: { position: 'absolute', top: 15, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between' },
    badge: { backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 4 },
    badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    bottomOverlay: { position: 'absolute', bottom: 20, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    captionText: { color: 'white', fontSize: 17, fontWeight: 'bold', width: '70%', textShadowColor: '#000', textShadowRadius: 8 },
    likeCountText: { color: 'white', fontSize: 11, marginTop: 4, fontWeight: '600' },
    heartButton: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: 25 },
    heartButtonActive: { backgroundColor: 'rgba(255,255,255,0.4)' },

    gridItem: { width: (SCREEN_WIDTH / 3) - 2, aspectRatio: 1, margin: 1, borderRadius: 10, overflow: 'hidden' },
    gridImage: { width: '100%', height: '100%' },
    avatarBorder: { padding: 3, borderRadius: 20, borderWidth: 2, borderColor: 'transparent' },
    allAvatar: { width: 60, height: 60, borderRadius: 40, padding: 3, backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#eee' },
    activeChip: { borderColor: '#4fd1c5', borderRadius: 50, padding: 3 },
    friendName: { fontSize: 11, color: '#999', marginTop: 6, fontWeight: '600', textAlign: 'center' },
    activeText: { color: '#4fd1c5', fontWeight: 'bold' },
    imageTagBadge: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', zIndex: 10 },
    imageTagText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});