import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, SafeAreaView, StatusBar, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
    background: '#1A2A2A',
    teal: '#2A5C59',
    tealDark: '#1E4442',
    tealLight: '#3A7C79',
    white: '#FFFFFF',
    textDark: '#1A2A2A',
    textMedium: '#444444',
    textLight: '#888888',
    border: '#2A4444',
    error: '#D9534F',
    gold: '#C4952A',
};

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};
        if (!email) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
        if (!password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) throw new Error(error.message);
            if (!data.user) throw new Error('Login failed');

            // Verify admin
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('name')
                .eq('id', data.user.id)
                .single();

            if (adminError || !admin) {
                await supabase.auth.signOut();
                throw new Error('You are not authorized as admin.');
            }

            router.replace('/(tabs)/admin-dashboard' as any);

        } catch (error: any) {
            Alert.alert('❌ Login Failed', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                {/* Logo */}
                <View style={styles.logoSection}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoIconText}>⌂</Text>
                    </View>
                    <Text style={styles.logoText}>Rent Now</Text>
                    <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>⚙️ Admin Panel</Text>
                    </View>
                </View>

                <Text style={styles.heading}>Admin Login</Text>
                <Text style={styles.subheading}>Access restricted to authorized admins only</Text>

                {/* Email */}
                <Text style={styles.label}>Admin Email</Text>
                <TextInput
                    style={[styles.input, errors.email ? styles.inputError : null]}
                    placeholder="admin@rentnow.app"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                {/* Password */}
                <Text style={styles.label}>Password</Text>
                <View style={[styles.passwordRow, errors.password ? styles.inputError : null]}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Enter admin password"
                        placeholderTextColor={COLORS.textLight}
                        value={password}
                        onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Text style={styles.eyeBtn}>{showPassword ? '🙈' : '👁️'}</Text>
                    </TouchableOpacity>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TouchableOpacity
                    style={[styles.loginBtn, loading && styles.btnDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading
                        ? <ActivityIndicator color={COLORS.white} />
                        : <Text style={styles.loginBtnText}>🔐 Login as Admin</Text>
                    }
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
    backBtn: { marginBottom: 24 },
    backText: { fontSize: 15, color: COLORS.tealLight, fontWeight: '600' },
    logoSection: { alignItems: 'center', marginBottom: 36, marginTop: 20 },
    logoIcon: {
        width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.teal,
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    logoIconText: { color: COLORS.white, fontSize: 32 },
    logoText: { fontSize: 26, fontWeight: '700', color: COLORS.white, marginBottom: 10 },
    adminBadge: {
        backgroundColor: COLORS.gold, borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 6,
    },
    adminBadgeText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
    heading: { fontSize: 26, fontWeight: '700', color: COLORS.white, marginBottom: 6 },
    subheading: { fontSize: 14, color: COLORS.textLight, marginBottom: 32 },
    label: { fontSize: 13, fontWeight: '700', color: '#AAB8B8', marginBottom: 8, letterSpacing: 0.3 },
    input: {
        backgroundColor: '#243333', borderRadius: 12, borderWidth: 1.5,
        borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
        fontSize: 15, color: COLORS.white, marginBottom: 6,
    },
    inputError: { borderColor: COLORS.error },
    errorText: { fontSize: 12, color: COLORS.error, marginBottom: 12 },
    passwordRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#243333',
        borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
        paddingHorizontal: 16, marginBottom: 6,
    },
    passwordInput: { flex: 1, fontSize: 15, color: COLORS.white, paddingVertical: 14 },
    eyeBtn: { fontSize: 18, paddingLeft: 8 },
    loginBtn: {
        backgroundColor: COLORS.teal, borderRadius: 12,
        paddingVertical: 16, alignItems: 'center', marginTop: 24,
    },
    btnDisabled: { opacity: 0.6 },
    loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});