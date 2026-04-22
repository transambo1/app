import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { collection, addDoc, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

// 1. Định nghĩa kiểu dữ liệu cho một chuyến đi
export interface Trip {
    id?: string;
    title: string;
    coverImage: string;
    startDate: string;
    endDate: string;
    region: string;
    isPrivate: boolean;
    createdAt?: any;
    userId: string; // ID của người tạo chuyến đi
}

// 2. Định nghĩa cấu trúc State của TripSlice
interface TripState {
    trips: Trip[];
    loading: boolean;
    error: string | null;
}

const initialState: TripState = {
    trips: [],
    loading: false,
    error: null,
};

// --- CÁC HÀM THUNK (GỌI FIREBASE) ---

// Thunk: Tải danh sách chuyến đi của người dùng hiện tại
export const fetchTrips = createAsyncThunk(
    'trips/fetchTrips',
    async (userId: string, { rejectWithValue }) => {
        try {
            const tripsRef = collection(db, 'trips');
            // Lấy các chuyến đi do user này tạo, sắp xếp mới nhất lên đầu
            const q = query(tripsRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
            const snapshot = await getDocs(q);

            const tripsList: Trip[] = [];
            snapshot.forEach((doc) => {
                tripsList.push({ id: doc.id, ...doc.data() } as Trip);
            });
            return tripsList;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Thunk: Tạo chuyến đi mới
export const createTrip = createAsyncThunk(
    'trips/createTrip',
    async (newTrip: Omit<Trip, 'id' | 'createdAt'>, { rejectWithValue }) => {
        try {
            const docRef = await addDoc(collection(db, 'trips'), {
                ...newTrip,
                createdAt: serverTimestamp(), // Firebase tự động lấy giờ server
            });
            return { id: docRef.id, ...newTrip };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// --- TẠO SLICE ---
const tripSlice = createSlice({
    name: 'trips',
    initialState,
    reducers: {
        // Có thể thêm các hàm xử lý nội bộ ở đây nếu cần (ví dụ: clearTrips khi đăng xuất)
        clearTrips: (state) => {
            state.trips = [];
        }
    },
    extraReducers: (builder) => {
        // Xử lý trạng thái của fetchTrips
        builder.addCase(fetchTrips.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchTrips.fulfilled, (state, action) => {
            state.loading = false;
            state.trips = action.payload;
        });
        builder.addCase(fetchTrips.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload as string;
        });

        // Xử lý trạng thái của createTrip
        builder.addCase(createTrip.fulfilled, (state, action) => {
            // Khi tạo thành công, thêm chuyến đi mới vào đầu danh sách hiện tại
            state.trips.unshift(action.payload as Trip);
        });
    },
});

export const { clearTrips } = tripSlice.actions;
export default tripSlice.reducer;