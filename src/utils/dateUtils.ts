// src/utils/dateUtils.ts

/**
 * Hàm 1: Định dạng thời gian cho tin nhắn cuối ở danh sách Inbox
 */
export const formatInboxTime = (timestamp: any) => {
    if (!timestamp) return "";
    // Chuyển Firebase Timestamp sang Date object
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();

    // Tính khoảng cách ngày
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const msgTime = date.getTime();

    if (msgTime >= startOfToday) {
        // Nếu là hôm nay: Hiện giờ (14:30)
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (msgTime >= startOfToday - 6 * 24 * 60 * 60 * 1000) {
        // Trong vòng 7 ngày: Hiện Thứ (Thứ 2)
        const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    } else {
        // Trên 1 tuần: Hiện Ngày/Tháng (02/02)
        return `${date.getDate()}/${date.getMonth() + 1}`;
    }
};

/**
 * Hàm 2: Định dạng nhãn thời gian phân tách trong màn hình Chat (Date Header)
 */
export const formatChatHeaderTime = (date: Date) => {
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays < 1) {
        const isSameDay = now.getDate() === date.getDate() &&
            now.getMonth() === date.getMonth() &&
            now.getFullYear() === date.getFullYear();
        if (isSameDay) {
            return now.toLocaleDateString();
        }
    }
    if (diffInDays === 1) return "Hôm qua";
    if (diffInDays < 7) {
        const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    }
    return `${date.getDate()} tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
};