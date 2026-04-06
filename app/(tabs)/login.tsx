import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
  background: '#EAE6DD',
  teal: '#2A5C59',
  tealDark: '#1E4442',
  white: '#FFFFFF',
  textDark: '#1A2A2A',
  textMedium: '#444444',
  textLight: '#888888',
  border: '#D5CFC4',
  error: '#D9534F',
};

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'tenant' | 'landlord' }>();

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
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
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
      if (!data.user) throw new Error('Login failed. Please try again.');

      if (role === 'tenant') {
        const { data: profile, error: profileError } = await supabase
          .from('tenants')
          .select('first_name')
          .eq('id', data.user.id)
          .single();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          throw new Error('No tenant account found with this email.');
        }
        // ✅ Success message for tenant
        Alert.alert(
          '✅ Welcome back!',
          `You have successfully logged in as ${profile.first_name}. Happy house hunting! 🏠`,
          [{ text: 'Let\'s Go!', onPress: () => router.replace('/(tabs)' as any) }]
        );
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('landlords')
          .select('first_name')
          .eq('id', data.user.id)
          .single();
        if (profileError || !profile) {
          await supabase.auth.signOut();
          throw new Error('No landlord account found with this email.');
        }
        // ✅ Success message for landlord
        Alert.alert(
          '✅ Welcome back!',
          `You have successfully logged in as ${profile.first_name}. Manage your listings! 🏢`,
          [{ text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/landlord-dashboard' as any) }]
        );
      }

    } catch (error: any) {
      Alert.alert('❌ Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoRow}
          onPress={() => router.replace('/(tabs)' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⌂</Text>
          </View>
          <Text style={styles.logoText}>Rent Now</Text>
        </TouchableOpacity>

        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {role === 'landlord' ? '🏢 Landlord' : '🏠 Tenant'}
          </Text>
        </View>

        <Text style={styles.heading}>Welcome back!</Text>
        <Text style={styles.subheading}>Log in with your email and password</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="you@example.com"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <Text style={styles.label}>Password</Text>
        <View style={[styles.passwordRow, errors.password ? styles.inputError : null]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
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
            : <Text style={styles.loginBtnText}>Log In</Text>
          }
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace({
            pathname: '/(tabs)/who-are-you' as any,
            params: { action: 'signup' },
          })}
        >
          <Text style={styles.switchText}>
            Don't have an account?{' '}
            <Text style={styles.switchTextBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logoIconText: { color: COLORS.white, fontSize: 18 },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  roleBadge: {
    alignSelf: 'flex-start', backgroundColor: '#E8F4F3', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1.5,
    borderColor: COLORS.teal, marginBottom: 20,
  },
  roleBadgeText: { color: COLORS.teal, fontSize: 13, fontWeight: '700' },
  heading: { fontSize: 28, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMedium, marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, letterSpacing: 0.3 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.textDark, marginBottom: 6,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 12 },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 16, marginBottom: 6,
  },
  passwordInput: { flex: 1, fontSize: 15, color: COLORS.textDark, paddingVertical: 14 },
  eyeBtn: { fontSize: 18, paddingLeft: 8 },
  loginBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 24,
  },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textLight, marginHorizontal: 12 },
  switchBtn: { alignItems: 'center' },
  switchText: { fontSize: 14, color: COLORS.textMedium },
  switchTextBold: { color: COLORS.teal, fontWeight: '700' },
});