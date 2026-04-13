import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity, Image,
    StyleSheet, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { db } from '../services/firebase';
import {
    collection, query, orderBy, onSnapshot, addDoc,
    serverTimestamp, doc, setDoc, updateDoc
} from 'firebase/firestore';
import { formatChatHeaderTime } from '../utils/dateUtils';
import * as Notifications from 'expo-notifications';

export default function ChatDetailScreen({ route, navigation }: any) {
    const { friendId, friendName, avatar } = route.params;

    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showTimeId, setShowTimeId] = useState<string | null>(null);

    // Thêm 1 state để kích hoạt việc kiểm tra Online/Offline mỗi 30s
    const [currentTime, setCurrentTime] = useState(Date.now());
    const inputRef = useRef<TextInput>(null);

    const userRedux = useSelector((state: RootState) => state.user.info);
    const friends = useSelector((state: RootState) => state.friends.list);

    // Tìm thông tin bạn bè mới nhất từ Redux
    const friendInfo = useMemo(() => {
        return friends.find((f: any) => f.uid === friendId) || { name: friendName, avatar: avatar };
    }, [friends, friendId]);

    // LOGIC ONLINE REALTIME (Tự động cập nhật mỗi 30s)
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Tính toán Online dựa vào currentTime (bỏ mảng phụ thuộc cứng nhắc đi)
    const isOnline = useMemo(() => {
        if (!friendInfo.lastActive) return false;
        try {
            const lastActiveDate = friendInfo.lastActive.toDate().getTime();
            const diffInMinutes = (currentTime - lastActiveDate) / 1000 / 60;
            return diffInMinutes < 5;
        } catch (e) { return false; }
    }, [friendInfo.lastActive, currentTime]);

    const chatId = useMemo(() => {
        if (!userRedux?.uid) return '';
        return userRedux.uid < friendId ? `${userRedux.uid}_${friendId}` : `${friendId}_${userRedux.uid}`;
    }, [userRedux?.uid, friendId]);

    useEffect(() => {
        if (!chatId || !userRedux?.uid) return;

        const markAsRead = async () => {
            try {
                const chatRef = doc(db, "chats", chatId);
                await updateDoc(chatRef, { isSeen: true });
                await Notifications.setBadgeCountAsync(0);
            } catch (e) { console.log("Lỗi cập nhật isSeen:", e); }
        };
        markAsRead();

        const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            // Sửa lỗi: Lọc bỏ các tin nhắn bị null thời gian trong tích tắc đầu tiên
            const msgList = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                createdAt: d.data().createdAt || { toDate: () => new Date() } // Fallback an toàn
            }));
            setMessages(msgList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [chatId, userRedux?.uid]);

    const handleSend = async () => {
        if (!message.trim() || !userRedux?.uid) return;
        const textToSend = message.trim();
        setMessage('');

        const tempMsg = {
            id: Date.now().toString(),
            text: textToSend,
            senderId: userRedux.uid,
            createdAt: { toDate: () => new Date() }, // Fake Date an toàn
            isPending: true
        };
        setMessages(prev => [tempMsg, ...prev]);

        try {
            const chatRef = doc(db, "chats", chatId);
            const msgRef = collection(db, "chats", chatId, "messages");
            await addDoc(msgRef, { text: textToSend, senderId: userRedux.uid, createdAt: serverTimestamp() });
            await setDoc(chatRef, {
                lastMessage: textToSend,
                lastSenderId: userRedux.uid,
                updatedAt: serverTimestamp(),
                participants: [userRedux.uid, friendId],
                isSeen: false,
                usersInfo: [
                    { uid: userRedux.uid, name: userRedux.name, avatar: userRedux.avatar || "" },
                    { uid: friendId, name: friendInfo.name, avatar: friendInfo.avatar || "" }
                ]
            }, { merge: true });
        } catch (error) {
            console.error("Lỗi gửi tin nhắn:", error);
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        }
    };

    const renderItem = useCallback(({ item, index }: any) => {
        const isMine = item.senderId === userRedux?.uid;
        // Do lúc nãy mình fallback an toàn nên khúc này lúc nào cũng chạy tốt
        const msgDate = item.createdAt.toDate();

        let showDateHeader = false;
        if (index === messages.length - 1) { showDateHeader = true; }
        else {
            const nextMsg = messages[index + 1];
            const nextDate = nextMsg.createdAt?.toDate ? nextMsg.createdAt.toDate() : new Date();
            if (Math.abs(msgDate.getTime() - nextDate.getTime()) > 30 * 60 * 1000) { showDateHeader = true; }
        }

        return (
            <View>
                {showDateHeader && <Text style={styles.dateHeader}>{formatChatHeaderTime(msgDate)}</Text>}
                <TouchableOpacity onPress={() => { setShowTimeId(showTimeId === item.id ? null : item.id); Keyboard.dismiss(); }} activeOpacity={1}>
                    <View style={[styles.msgWrapper, isMine ? styles.myMsgWrapper : styles.theirMsgWrapper]}>
                        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
                            <Text style={[styles.msgText, isMine ? styles.myMsgText : styles.theirMsgText]}>{item.text}</Text>
                        </View>
                        {showTimeId === item.id && (
                            <Text style={[styles.msgTime, isMine && { textAlign: 'right' }]}>
                                {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        )}
                        {item.isPending && <Text style={styles.pendingText}>Đang gửi...</Text>}
                    </View>
                </TouchableOpacity>
            </View>
        );
    }, [userRedux?.uid, showTimeId, messages]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={28} color="#4fd1c5" />
                    </TouchableOpacity>

                    <View style={styles.headerInfo}>
                        <View style={styles.avatarWrapper}>
                            <Image
                                source={{ uri: friendInfo.avatar || 'https://via.placeholder.com/150' }}
                                style={styles.avatar}
                            />
                            {/* CHẤM XANH ONLINE TRÊN HEADER */}
                            {isOnline && <View style={styles.onlineDot} />}
                        </View>
                        <View>
                            <Text style={styles.headerName}>{friendInfo.name}</Text>
                            <Text style={styles.statusText}>{isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}</Text>
                        </View>
                    </View>
                    <View style={{ width: 28 }} />
                </View>

                {loading ? <ActivityIndicator style={{ flex: 1 }} color="#4fd1c5" /> : (
                    <FlatList data={messages} renderItem={renderItem} keyExtractor={item => item.id} inverted contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} removeClippedSubviews={true} />
                )}

                <View style={styles.inputArea}>
                    <TextInput ref={inputRef} style={styles.input} value={message} onChangeText={setMessage} placeholder="Nhắn tin...." multiline />
                    <TouchableOpacity style={[styles.sendBtn, !message.trim() && { opacity: 0.5 }]} onPress={handleSend} disabled={!message.trim()}>
                        <Ionicons name="send" size={30} color="#002fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ... styles giữ nguyên
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 0.5, borderColor: '#eee' },
    headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    avatarWrapper: { position: 'relative', marginRight: 10 },
    avatar: { width: 40, height: 40, borderRadius: 19, backgroundColor: '#eee' },
    onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, backgroundColor: '#44bd32', borderWidth: 2, borderColor: '#fff' },
    headerName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
    statusText: { fontSize: 11, color: '#999' },
    listContent: { paddingHorizontal: 15, paddingVertical: 10 },
    msgWrapper: { marginBottom: 10, maxWidth: '80%' },
    myMsgWrapper: { alignSelf: 'flex-end' },
    theirMsgWrapper: { alignSelf: 'flex-start' },
    bubble: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20 },
    myBubble: { backgroundColor: '#4fd1c5', borderBottomRightRadius: 2 },
    theirBubble: { backgroundColor: '#f0f0f0', borderBottomLeftRadius: 2 },
    msgText: { fontSize: 16 },
    myMsgText: { color: '#fff' },
    theirMsgText: { color: '#000' },
    dateHeader: { alignSelf: 'center', color: '#999', fontSize: 12, fontWeight: '600', marginVertical: 20, backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
    msgTime: { fontSize: 10, color: '#aaa', marginTop: 4, paddingHorizontal: 4 },
    pendingText: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 2 },
    inputArea: { flexDirection: 'row', padding: 10, alignItems: 'flex-end', borderTopWidth: 0.5, marginBottom: 10, borderColor: '#eee', backgroundColor: '#fff' },
    input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 16, maxHeight: 100 },
    sendBtn: { backgroundColor: '#ffffff', width: 30, height: 30, borderRadius: 20, marginBottom: 7, justifyContent: 'center', alignItems: 'center', marginLeft: 10, transform: [{ rotate: '342deg' },] }
});