import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ChatState {
    inbox: any[]; // Lưu danh sách các cuộc hội thoại
}

const initialState: ChatState = {
    inbox: [],
};

export const chatSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {
        setInbox: (state, action: PayloadAction<any[]>) => {
            state.inbox = action.payload;
        },
        updateLastMessage: (state, action: PayloadAction<{ chatId: string, message: string }>) => {
            const chat = state.inbox.find(c => c.id === action.payload.chatId);
            if (chat) {
                chat.lastMessage = action.payload.message;
            }
        },
        addOptimisticMessage: (state, action: PayloadAction<{ chatId: string, message: any }>) => {
            const chatIndex = state.inbox.findIndex(c => c.id === action.payload.chatId);
            if (chatIndex !== -1) {
                // Cập nhật tin nhắn cuối và đẩy lên đầu danh sách
                state.inbox[chatIndex].lastMessage = action.payload.message.text;
                state.inbox[chatIndex].updatedAt = new Date().toISOString();
                // Đưa chat này lên đầu mảng
                const [movedChat] = state.inbox.splice(chatIndex, 1);
                state.inbox.unshift(movedChat);
            }
        }
    },
});

export const { setInbox, updateLastMessage } = chatSlice.actions;
export default chatSlice.reducer;