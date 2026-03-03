import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// 1. Giữ nguyên interface này
export interface UserData {
    uid: string | null;
    name: string;
    avatar: string;
    bio?: string;
    email?: string;
}

interface UserState {
    info: UserData | null;
    loading: boolean;
}

// 2. Phải dùng cái này xuống dưới
const initialState: UserState = {
    info: null,
    loading: true,
};

const userSlice = createSlice({
    name: 'user',
    initialState, // SỬA CHỖ NÀY: Dùng biến initialState đã có type UserState ở trên
    reducers: {
        // SỬA CHỖ NÀY: Thay 'any' bằng 'UserData' để TypeScript biết payload chứa gì
        setUserData: (state, action: PayloadAction<UserData>) => {
            state.info = action.payload;
            state.loading = false;
        },
        clearUser: (state) => {
            state.info = null;
            state.loading = false;
        }
    }
});

export const { setUserData, clearUser } = userSlice.actions;
export default userSlice.reducer;