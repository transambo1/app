import { initializeApp, getApps, getApp } from 'firebase/app';
// Đưa hết vào một dòng import từ 'firebase/auth'
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    Auth
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDq5bfMElb-PnXMVHSBVmCX8EM_GZvpqoY",

    authDomain: "katy-6a090.firebaseapp.com",

    projectId: "katy-6a090",

    storageBucket: "katy-6a090.firebasestorage.app",

    messagingSenderId: "616902516910",

    appId: "1:616902516910:web:ff4060e07c4ac4ec220d3f",

    measurementId: "G-X834BXRPW3",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;

// Kiểm tra xem Auth đã được khởi tạo chưa để tránh lỗi khởi tạo 2 lần
if (getApps().length === 0) {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
} else {
    auth = getAuth(app);
}

export const db = getFirestore(app);
export { auth };