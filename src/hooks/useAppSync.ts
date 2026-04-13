import { useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { useDispatch } from 'react-redux';
import { setUserData, clearUser } from '../store/slices/userSlice';
import { setFriends, clearFriends } from '../store/slices/friendSlice';
import { setInbox } from '../store/slices/chatSlice';
import * as Notifications from 'expo-notifications';

export const useAppSync = () => {
    const dispatch = useDispatch();

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Biến cục bộ lưu trữ các hàm tắt theo dõi bạn bè
                let unsubsFriendsList: any[] = [];

                // --- 1. Lấy data User & Bạn bè (REALTIME) ---
                const unsubData = onSnapshot(doc(db, "users", user.uid), (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        const friendIds = data.friends || [];

                        // Cập nhật thông tin của chính mình
                        dispatch(setUserData({
                            uid: user.uid,
                            name: data.name || "Người dùng",
                            avatar: data.avatar || "",
                            bio: data.bio || "",
                            email: user.email || ""
                        }));

                        // Dọn dẹp các luồng lắng nghe cũ trước khi tạo mới (tránh rò rỉ bộ nhớ)
                        unsubsFriendsList.forEach(unsub => unsub());
                        unsubsFriendsList = [];

                        if (friendIds.length > 0) {
                            try {
                                // Hàm chặt nhỏ mảng thành các cụm 10 người để vượt giới hạn Firebase
                                const chunkArray = (array: any, size: any) => {
                                    const chunked = [];
                                    for (let i = 0; i < array.length; i += size) {
                                        chunked.push(array.slice(i, i + size));
                                    }
                                    return chunked;
                                };

                                const chunks = chunkArray(friendIds, 10);
                                const friendsMap = new Map();

                                // Mở luồng lắng nghe cho từng cụm bạn bè
                                chunks.forEach((chunk) => {
                                    const q = query(collection(db, "users"), where("__name__", "in", chunk));

                                    const unsubFriendChunk = onSnapshot(q, (snapshot) => {
                                        snapshot.docs.forEach((docFriend) => {
                                            friendsMap.set(docFriend.id, {
                                                uid: docFriend.id,
                                                id: docFriend.id,
                                                name: docFriend.data().name || "Bạn bè",
                                                avatar: docFriend.data().avatar || "",
                                                lastActive: docFriend.data().lastActive || null // Hút trạng thái online
                                            });
                                        });

                                        // Gom Map thành mảng và đẩy lên Redux
                                        const updatedFriendsList = Array.from(friendsMap.values());
                                        dispatch(setFriends(updatedFriendsList));
                                    });

                                    // Lưu lại hàm tắt luồng này
                                    unsubsFriendsList.push(unsubFriendChunk);
                                });

                            } catch (error) {
                                console.error("Lỗi khi tải danh sách bạn bè:", error);
                            }
                        } else {
                            dispatch(setFriends([]));
                        }
                    }
                });

                // --- 2. Lấy danh sách Chat & Gửi thông báo ---
                const qChats = query(
                    collection(db, "chats"),
                    where("participants", "array-contains", user.uid),
                    orderBy("updatedAt", "desc")
                );

                const unsubChats = onSnapshot(qChats, (snapshot) => {
                    let totalUnreadCount = 0;

                    // KIỂM TRA SỰ THAY ĐỔI ĐỂ BẮN THÔNG BÁO
                    snapshot.docChanges().forEach((change) => {
                        const chatData = change.doc.data();

                        // Nếu có tin nhắn mới (modified) và mình là người nhận và chưa xem
                        if (change.type === "modified") {
                            const isNewIncoming = chatData.isSeen === false && chatData.lastSenderId !== user.uid;

                            if (isNewIncoming) {
                                const sender = chatData.usersInfo?.find((u: any) => u.uid !== user.uid);

                                Notifications.scheduleNotificationAsync({
                                    content: {
                                        title: `💬 ${sender?.name || "Tin nhắn mới"}`,
                                        body: chatData.lastMessage,
                                        sound: true,
                                        priority: Notifications.AndroidNotificationPriority.MAX,
                                    },
                                    trigger: null,
                                });
                            }
                        }
                    });

                    // TÍNH TỔNG SỐ TIN CHƯA ĐỌC CHO BADGE
                    const chatList = snapshot.docs.map(docChat => {
                        const data = docChat.data();
                        if (data.isSeen === false && data.lastSenderId !== user.uid) {
                            totalUnreadCount++;
                        }

                        return {
                            id: docChat.id,
                            ...data,
                            displayTime: data.updatedAt?.toDate()
                                ? data.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''
                        };
                    });

                    Notifications.setBadgeCountAsync(totalUnreadCount);
                    dispatch(setInbox(chatList));
                });

                // --- 3. DỌN DẸP KHI LOGOUT HOẶC ĐÓNG APP ---
                return () => {
                    unsubData();
                    unsubChats();
                    // Tắt toàn bộ luồng nghe lén bạn bè
                    unsubsFriendsList.forEach(unsub => unsub());
                };

            } else {
                dispatch(clearUser());
                dispatch(clearFriends());
                Notifications.setBadgeCountAsync(0);
            }
        });

        return () => unsubAuth();
    }, [dispatch]);
};