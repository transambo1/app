// services/user.ts
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

export const getUserNameById = async (uid: string): Promise<string> => {
    try {
        const userDoc = await getDoc(doc(db, "users", uid));
        return userDoc.exists() ? userDoc.data().name : "Người dùng";
    } catch (error) {
        console.error("Error fetching user name:", error);
        return "Người dùng";
    }
};