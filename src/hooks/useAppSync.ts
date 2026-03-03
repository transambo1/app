import { useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
                // --- 1. Lấy data User & Bạn bè (Đã sửa lỗi giới hạn 10 bạn bè) ---
                const unsubData = onSnapshot(doc(db, "users", user.uid), async (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        const friendIds = data.friends || [];

                        dispatch(setUserData({
                            uid: user.uid,
                            name: data.name || "Người dùng",
                            avatar: data.avatar || "",
                            bio: data.bio || "",
                            email: user.email || ""
                        }));

                        // --- FIX LỖI GIỚI HẠN 10 PHẦN TỬ CỦA FIREBASE Ở ĐÂY ---
                        if (friendIds.length > 0) {
                            try {
                                // Hàm chặt nhỏ mảng thành các cụm 10 người
                                const chunkArray = (array: any[], size: number) => {
                                    const chunked = [];
                                    for (let i = 0; i < array.length; i += size) {
                                        chunked.push(array.slice(i, i + size));
                                    }
                                    return chunked;
                                };

                                // Chia mảng friendIds ra làm nhiều cụm, mỗi cụm tối đa 10 ID
                                const chunks = chunkArray(friendIds, 10);

                                // Gửi TẤT CẢ các truy vấn lên Firebase cùng một lúc
                                const fetchPromises = chunks.map((chunk) => {
                                    const q = query(collection(db, "users"), where("__name__", "in", chunk));
                                    return getDocs(q);
                                });

                                // Đợi tất cả truy vấn báo cáo kết quả về
                                const snapshots = await Promise.all(fetchPromises);

                                // Gom tất cả dữ liệu lại thành 1 danh sách
                                const detailedFriends: any[] = [];
                                snapshots.forEach((snapChunk) => {
                                    snapChunk.docs.forEach((doc) => {
                                        detailedFriends.push({
                                            uid: doc.id,
                                            id: doc.id,
                                            name: doc.data().name || "Bạn bè",
                                            avatar: doc.data().avatar || ""
                                        });
                                    });
                                });

                                // Đẩy danh sách hoàn chỉnh lên Redux
                                dispatch(setFriends(detailedFriends));

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
                                // Tìm tên người gửi trong mảng usersInfo
                                const sender = chatData.usersInfo?.find((u: any) => u.uid !== user.uid);

                                // Bắn thông báo ra màn hình
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
                    const chatList = snapshot.docs.map(doc => {
                        const data = doc.data();
                        // Nếu mình là người nhận và chưa xem thì tính là 1 tin chưa đọc
                        if (data.isSeen === false && data.lastSenderId !== user.uid) {
                            totalUnreadCount++;
                        }

                        return {
                            id: doc.id,
                            ...data,
                            displayTime: data.updatedAt?.toDate()
                                ? data.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : ''
                        };
                    });

                    // Cập nhật số Badge trên icon App (Số đỏ đỏ ngoài icon)
                    Notifications.setBadgeCountAsync(totalUnreadCount);

                    dispatch(setInbox(chatList));
                });

                return () => {
                    unsubData();
                    unsubChats();
                };

            } else {
                dispatch(clearUser());
                dispatch(clearFriends());
                Notifications.setBadgeCountAsync(0); // Logout thì xóa Badge
            }
        });
        return () => unsubAuth();
    }, [dispatch]);
};