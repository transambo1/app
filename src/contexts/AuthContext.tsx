import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User as FirebaseUser, signOut } from "firebase/auth";
import { auth } from "../services/firebase"; // Nhớ trỏ đúng đường dẫn file firebase
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export type AppUser = {
    uid: string;
    email: string | null;
    name?: string; // Tên hiển thị
    age?: number;         // Tuổi
    phoneNumber?: string;
    location?: string;
};

type AuthContextType = {
    user: AppUser | null;
    loading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);


    // ... bên trong AuthProvider
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // 1. Lấy dữ liệu cơ bản từ Auth
                let userData: AppUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                };

                // 2. Lấy dữ liệu bổ sung từ Firestore
                try {
                    const docRef = doc(db, "users", firebaseUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const extraData = docSnap.data();
                        userData = { ...userData, ...extraData }; // Gộp dữ liệu
                    }
                } catch (error) {
                    console.error("Lỗi lấy thông tin Firestore:", error);
                }

                setUser(userData);
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (e) {
            console.error("Logout error", e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}