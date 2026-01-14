import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDq5bfMElb-PnXMVHSBVmCX8EM_GZvpqoY",
    authDomain: "katy-6a090.firebaseapp.com",
    projectId: "katy-6a090",
    storageBucket: "katy-6a090.firebasestorage.app",
    messagingSenderId: "616902516910",
    appId: "1:616902516910:web:ff4060e07c4ac4ec220d3f",
    measurementId: "G-X834BXRPW3"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
