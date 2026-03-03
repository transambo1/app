import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserData } from '../store/slices/userSlice';
import { formatInboxTime } from '../utils/dateUtils';

export default function ChatListScreen({ navigation }: any) {
    const [searchText, setSearchText] = useState('');

    const inbox = useSelector((state: RootState) => state.chats.inbox);
    const friends = useSelector((state: RootState) => state.friends.list);
    const currentUser = useSelector((state: RootState) => state.user.info);

    // Lọc danh sách chat và gợi ý bạn bè
    const filteredResults = useMemo(() => {
        const keyword = searchText.toLowerCase().trim();

        const currentChats = inbox.filter(chat => {
            const friendInfo = chat.usersInfo?.find((u: any) => u.uid !== currentUser?.uid);
            return friendInfo?.name?.toLowerCase().includes(keyword);
        });

        const friendSuggestions = friends.filter((f: UserData) => {
            const alreadyHasChat = inbox.some(c => c.participants.includes(f.uid));
            const matchesSearch = f.name?.toLowerCase().includes(keyword);
            return matchesSearch && !alreadyHasChat;
        });

        return { currentChats, suggestions: friendSuggestions };
    }, [searchText, inbox, friends, currentUser?.uid]);

    // Render từng dòng tin nhắn trong danh sách
    const renderChatItem = useCallback(({ item }: any) => {
        // 1. Tìm UID của bạn bè trong cuộc trò chuyện
        const friendUid = item.participants.find((id: string) => id !== currentUser?.uid);

        // 2. Lấy thông tin mới nhất từ Redux Store (để lấy Avatar và lastActive chuẩn)
        const friendFromStore = friends.find((f: any) => f.uid === friendUid);
        const friendInfo = friendFromStore || item.usersInfo?.find((u: any) => u.uid !== currentUser?.uid) || {};

        // 3. Kiểm tra trạng thái tin nhắn chưa đọc
        const isUnread = item.isSeen === false && item.lastSenderId !== currentUser?.uid;

        // 4. Logic Online dựa trên trường 'lastActive' trong Database
        const isOnline = useMemo(() => {
            if (!friendInfo.lastActive) return false;
            try {
                // Chuyển đổi Firestore Timestamp sang Date object
                const lastActiveDate = friendInfo.lastActive.toDate();
                const now = new Date();
                // Tính khoảng cách thời gian (mili giây sang phút)
                const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / 1000 / 60;

                // Nếu hoạt động trong vòng 5 phút đổ lại thì coi là Online
                return diffInMinutes < 5;
            } catch (e) { return false; }
        }, [friendInfo.lastActive]);

        return (
            <TouchableOpacity
                style={styles.chatCard}
                onPress={() => navigation.navigate('Chat', {
                    friendId: friendInfo.uid,
                    friendName: friendInfo.name,
                    avatar: friendInfo.avatar
                })}
            >
                <View style={styles.avatarContainer}>
                    {/* Hiển thị Avatar - Ưu tiên link từ Cloudinary */}
                    <Image
                        source={{ uri: friendInfo.avatar || 'https://via.placeholder.com/150' }}
                        style={styles.avatar}
                    />
                    {/* Chấm xanh trạng thái Online */}
                    {isOnline && <View style={styles.onlineStatusDot} />}
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={[styles.friendName, isUnread && styles.unreadText]} numberOfLines={1}>
                            {friendInfo.name || 'Người dùng'}
                        </Text>
                        <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                            {isOnline ? 'Đang hoạt động' : formatInboxTime(item.updatedAt)}
                        </Text>
                    </View>

                    <View style={styles.chatFooter}>
                        <Text style={[styles.lastMsg, isUnread && styles.unreadLastMsg]} numberOfLines={1}>
                            {item.lastSenderId === currentUser?.uid ? 'Bạn: ' : ''}{item.lastMessage}
                        </Text>
                        {/* Chấm xanh thông báo có tin nhắn mới */}
                        {isUnread && <View style={styles.unreadMsgDot} />}
                    </View>
                </View>
            </TouchableOpacity>
        );
    }, [currentUser?.uid, friends, navigation]);

    // Render danh sách gợi ý bạn bè (ngang)
    const renderSuggestionItem = useCallback(({ item }: any) => (
        <TouchableOpacity
            style={styles.suggestionCard}
            onPress={() => navigation.navigate('Chat', {
                friendId: item.uid,
                friendName: item.name,
                avatar: item.avatar
            })}
        >
            <Image source={{ uri: item.avatar || 'https://via.placeholder.com/150' }} style={styles.suggestAvatar} />
            <Text style={styles.suggestName} numberOfLines={1}>{item.name}</Text>
            <View style={styles.sayHiBtn}><Text style={styles.sayHiText}>Vẫy tay 👋</Text></View>
        </TouchableOpacity>
    ), [navigation]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.topBar}>
                <Text style={styles.title}>Tin nhắn</Text>
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm bạn bè để nhắn tin..."
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor="#999"
                    />
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {filteredResults.suggestions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Gợi ý bạn bè</Text>
                        <FlatList
                            horizontal
                            data={filteredResults.suggestions}
                            renderItem={renderSuggestionItem}
                            keyExtractor={item => item.uid}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingLeft: 20, paddingBottom: 10 }}
                        />
                    </View>
                )}

                <View style={styles.section}>
                    {inbox.length > 0 && <Text style={styles.sectionTitle}>Gần đây</Text>}
                    {filteredResults.currentChats.length > 0 ? (
                        filteredResults.currentChats.map(chat => (
                            <View key={chat.id}>{renderChatItem({ item: chat })}</View>
                        ))
                    ) : (
                        !filteredResults.suggestions.length && (
                            <View style={styles.center}><Text style={styles.emptyText}>Chưa có cuộc hội thoại nào</Text></View>
                        )
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    topBar: { paddingHorizontal: 20, paddingVertical: 10 },
    title: { fontSize: 32, fontWeight: 'bold', color: '#000' },
    searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
    searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F2', borderRadius: 15, paddingHorizontal: 12, height: 45 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#999', marginLeft: 20, marginBottom: 10, textTransform: 'uppercase' },
    chatCard: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' },
    avatarContainer: { position: 'relative' },
    avatar: { width: 60, height: 60, borderRadius: 50, backgroundColor: '#eee' },

    // Chấm xanh trạng thái hoạt động (Dưới cùng bên phải)
    onlineStatusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#44bd32',
        borderWidth: 2.5,
        borderColor: '#fff'
    },

    // Chấm xanh tin nhắn chưa đọc (Bên phải tin nhắn cuối)
    unreadMsgDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4fd1c5',
        marginLeft: 10
    },
    chatInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    friendName: { fontSize: 16, fontWeight: '600', color: '#000' },
    unreadText: { fontWeight: '800', fontSize: 17, color: '#000' },
    timeText: { fontSize: 12, color: '#999' },
    unreadTime: { color: '#4fd1c5', fontWeight: 'bold' },
    chatFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lastMsg: { fontSize: 14, color: '#888', flex: 1 },
    unreadLastMsg: { fontWeight: '700', color: '#333' },
    suggestionCard: { width: 90, alignItems: 'center', marginRight: 15 },
    suggestAvatar: { width: 55, height: 55, borderRadius: 22, marginBottom: 5 },
    suggestName: { fontSize: 11, fontWeight: '600', marginBottom: 5 },
    sayHiBtn: { backgroundColor: '#e6fffa', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 10 },
    sayHiText: { color: '#4fd1c5', fontSize: 10, fontWeight: 'bold' },
    center: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: '#999', fontSize: 14 }
});