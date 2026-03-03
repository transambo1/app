import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import friendReducer from './slices/friendSlice';
import chatReducer from './slices/chatSlice';

export const store = configureStore({
    reducer: {
        user: userReducer,
        friends: friendReducer,
        chats: chatReducer,
    },
    middleware(getDefaultMiddleware) {
        return getDefaultMiddleware({ serializableCheck: false });
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;