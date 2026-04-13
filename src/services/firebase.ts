import { initializeApp, getApps, getApp } from 'firebase/app';
// Đổi dòng import này
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
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

let auth: any;
try {
    auth = initializeAuth(app, {
        persistence: (getReactNativePersistence as any)(ReactNativeAsyncStorage)
    });
} catch (e) {
    auth = getAuth(app);
}

export const db = getFirestore(app); // Thêm dòng này
export { auth };