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

export default function TenantSignupStep3() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    firstName: string; lastName: string; email: string;
    mobile: string; address: string; pincode: string;
    state: string; city: string; aadhaar: string;
  }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // Step 1 — Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email: params.email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            email_confirmed: true,
          }
        }
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('Account creation failed');

      // Step 2 — Save tenant details
      const { error: profileError } = await supabase.from('tenants').insert({
        id: data.user.id,
        first_name: params.firstName,
        last_name: params.lastName,
        email: params.email,
        mobile_no: params.mobile,
        address: params.address,
        pincode: params.pincode,
        state: params.state,
        city: params.city,
        aadhaar_no: params.aadhaar,
      });

      if (profileError) throw profileError;

      Alert.alert(
        '✅ Account Created!',
        `Welcome ${params.firstName}! Your account has been created successfully.`,
        [{ text: 'Log In Now', onPress: () => router.replace('/(tabs)/login' as any) }]
      );
    } catch (error: any) {
      Alert.alert('❌ Signup Failed', error.message || 'Something went wrong');
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

        <View style={styles.stepRow}>
          <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={styles.stepActive}><Text style={styles.stepActiveText}>3</Text></View>
        </View>

        <Text style={styles.heading}>Create Password</Text>
        <Text style={styles.subheading}>Step 3 of 3 — Set a secure password</Text>

        <Text style={styles.label}>Password</Text>
        <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
          <TextInput
            style={styles.inputField}
            placeholder="Min. 6 characters"
            placeholderTextColor={COLORS.textLight}
            value={password}
            onChangeText={(t) => { setPassword(t); setErrors(e => ({ ...e, password: '' })); }}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.eyeBtn}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

        <Text style={styles.label}>Confirm Password</Text>
        <View style={[styles.inputRow, errors.confirmPassword ? styles.inputError : null]}>
          <TextInput
            style={styles.inputField}
            placeholder="Re-enter your password"
            placeholderTextColor={COLORS.textLight}
            value={confirmPassword}
            onChangeText={(t) => { setConfirmPassword(t); setErrors(e => ({ ...e, confirmPassword: '' })); }}
            secureTextEntry={!showConfirm}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.eyeBtn}>{showConfirm ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

        <TouchableOpacity
          style={[styles.signupBtn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.signupBtnText}>Create Account ✓</Text>
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
  backText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logoIconText: { color: COLORS.white, fontSize: 18 },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  stepActive: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center',
  },
  stepActiveText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  stepDone: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDoneText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMedium, marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 16, marginBottom: 6,
  },
  inputField: { flex: 1, fontSize: 15, color: COLORS.textDark, paddingVertical: 14 },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 10 },
  eyeBtn: { fontSize: 18, paddingLeft: 8 },
  signupBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  signupBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});