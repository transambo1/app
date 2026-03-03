import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const friendSlice = createSlice({
    name: 'friends',
    initialState: { list: [] as any, loading: true },
    reducers: {
        setFriends: (state, action: PayloadAction<any[]>) => {
            state.list = action.payload;
            state.loading = false;
        },
        clearFriends: (state) => {
            state.list = [];

            state.loading = false;
        }
    }
});
export const { setFriends, clearFriends } = friendSlice.actions;
export default friendSlice.reducer;