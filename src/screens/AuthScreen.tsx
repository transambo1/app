import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { auth } from '../services/firebase'; // Đường dẫn file firebase của bạn
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true); // Chuyển đổi giữa Đăng nhập và Đăng ký

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert("Lỗi", "Vui lòng nhập đầy đủ email và mật khẩu");
            return;
        }

        try {
            if (isLogin) {
                // Logic Đăng nhập
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Đăng nhập thành công!");
            } else {
                // Logic Đăng ký
                await createUserWithEmailAndPassword(auth, email, password);
                console.log("Đăng ký thành công!");
            }
        } catch (error: any) {
            Alert.alert("Lỗi", error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>{isLogin ? 'Vào App' : 'Tạo Tài Khoản'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                <Text style={styles.switchText}>
                    {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000' },
    title: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginBottom: 40, textAlign: 'center' },
    input: { backgroundColor: '#fff7f7', color: '#1f1f1f', padding: 15, borderRadius: 10, marginBottom: 15 },
    button: { backgroundColor: '#FFD700', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { fontWeight: 'bold', fontSize: 16 },
    switchText: { color: '#aaa', marginTop: 20, textAlign: 'center' }
});