import React, { useState } from 'react';
import {
    View, TextInput, TouchableOpacity, Text,
    StyleSheet, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

export default function AuthScreen() {
    // 1. Quản lý toàn bộ input trong 1 Object (Chuẩn Clean Code)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        age: '',
        location: ''
    });
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);

    // Hàm cập nhật input linh hoạt
    const handleChange = (key: string, value: string) => {
        setFormData({ ...formData, [key]: value });
    };

    const handleAuth = async () => {
        const { email, password, name, age, location } = formData;

        // Validation cơ bản
        if (!email || !password || (!isLogin && (!name || !age || !location))) {
            Alert.alert("Thông báo", "Vui lòng nhập đầy đủ các trường");
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                // Đăng nhập
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                // Đăng ký Auth
                const { user } = await createUserWithEmailAndPassword(auth, email, password);

                // 2. Lưu thông tin bổ sung vào Firestore (Bảng users)
                await setDoc(doc(db, "users", user.uid), {
                    name: name,
                    age: parseInt(age),
                    location: location,
                    email: email.toLowerCase(),
                    friends: [], // Khởi tạo mảng bạn bè trống để tránh lỗi logic sau này

                    createdAt: serverTimestamp(), // Lưu giờ theo server
                });
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>{isLogin ? 'Đăng Nhập' : 'Tạo Tài Khoản'}</Text>

            {!isLogin && (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder="Họ và tên"
                        onChangeText={(v) => handleChange('name', v)}
                        placeholderTextColor="#999"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Tuổi"
                        onChangeText={(v) => handleChange('age', v)}
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Địa chỉ (Location)"
                        onChangeText={(v) => handleChange('location', v)}
                        placeholderTextColor="#999"
                    />
                </>
            )}

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                onChangeText={(v) => handleChange('email', v)}
                placeholderTextColor="#999"
            />

            <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                secureTextEntry={true} // Bắt buộc là boolean {true} để tránh crash Fabric
                onChangeText={(v) => handleChange('password', v)}
                placeholderTextColor="#999"
            />

            <TouchableOpacity
                style={[styles.button, loading && { opacity: 0.6 }]}
                onPress={handleAuth}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.buttonText}>{isLogin ? 'VÀO APP' : 'ĐĂNG KÝ'}</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchText}>
                    {isLogin ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, justifyContent: 'center', padding: 25, backgroundColor: '#000' },
    title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    input: { backgroundColor: '#1A1A1A', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 12 },
    button: { backgroundColor: '#FFD700', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    buttonText: { fontWeight: 'bold', fontSize: 16 },
    switchText: { color: '#aaa', marginTop: 20, textAlign: 'center' }
});