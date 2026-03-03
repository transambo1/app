import { db, auth } from '../services/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export const updatePresence = async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            lastActive: serverTimestamp(),
        });
    }
};