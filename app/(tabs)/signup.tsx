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
  coral: '#E06449',
  white: '#FFFFFF',
  textDark: '#1A2A2A',
  textMedium: '#444444',
  textLight: '#888888',
  chipBg: '#E4DED3',
  border: '#D5CFC4',
  error: '#D9534F',
};

// ✅ Field component is now OUTSIDE SignupScreen — fixes keyboard issue
const Field = ({
  label, value, onChange, placeholder,
  keyboardType = 'default', secure = false,
  showToggle = false, onToggle = () => { }, error, maxLength,
}: any) => (
  <View style={styles.fieldWrapper}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputRow, error ? styles.inputError : null]}>
      <TextInput
        style={styles.inputField}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        maxLength={maxLength}
      />
      {showToggle && (
        <TouchableOpacity onPress={onToggle}>
          <Text style={styles.eyeBtn}>{!secure ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      )}
    </View>
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

export default function SignupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: 'tenant' | 'landlord' }>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!phone) newErrors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(phone)) newErrors.phone = 'Enter valid 10-digit number';
    if (!aadhaar) newErrors.aadhaar = 'Aadhaar number is required';
    else if (!/^\d{12}$/.test(aadhaar)) newErrors.aadhaar = 'Enter valid 12-digit Aadhaar';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Minimum 6 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!data.user) throw new Error('User creation failed');

      const profileData = {
        id: data.user.id,
        name,
        phone,
        aadhaar_no: aadhaar,
        address,
      };

      const table = role === 'tenant' ? 'tenants' : 'landlords';
      const { error: profileError } = await supabase
        .from(table)
        .insert(profileData);

      if (profileError) throw profileError;

      Alert.alert(
        '✅ Account Created!',
        'Your account has been created successfully!',
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/login') }]
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
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

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

        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>Sign up as a {role} on Rent Now</Text>

        <Field
          label="Full Name"
          value={name}
          onChange={setName}
          placeholder="John Doe"
          error={errors.name}
        />
        <Field
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          error={errors.email}
        />
        <Field
          label="Phone"
          value={phone}
          onChange={setPhone}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          error={errors.phone}
          maxLength={10}
        />
        <Field
          label="Aadhaar Number"
          value={aadhaar}
          onChange={setAadhaar}
          placeholder="12-digit Aadhaar number"
          keyboardType="phone-pad"
          error={errors.aadhaar}
          maxLength={12}
        />
        <Field
          label="Address"
          value={address}
          onChange={setAddress}
          placeholder="Your full address"
          error={errors.address}
        />
        <Field
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Min. 6 characters"
          secure={!showPassword}
          showToggle
          onToggle={() => setShowPassword(!showPassword)}
          error={errors.password}
        />
        <Field
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter your password"
          secure={!showConfirm}
          showToggle
          onToggle={() => setShowConfirm(!showConfirm)}
          error={errors.confirmPassword}
        />

        <TouchableOpacity
          style={[styles.signupBtn, loading && styles.btnDisabled]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.signupBtnText}>Create Account</Text>
          }
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => router.replace({ pathname: '/(tabs)/login', params: { role } })}
        >
          <Text style={styles.switchText}>
            Already have an account?{' '}
            <Text style={styles.switchTextBold}>Log In</Text>
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
  subheading: { fontSize: 15, color: COLORS.textMedium, marginBottom: 28 },
  fieldWrapper: { marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, letterSpacing: 0.3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 16, marginBottom: 4,
  },
  inputField: { flex: 1, fontSize: 15, color: COLORS.textDark, paddingVertical: 14 },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 10 },
  eyeBtn: { fontSize: 18, paddingLeft: 8 },
  signupBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 24,
  },
  btnDisabled: { opacity: 0.6 },
  signupBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textLight, marginHorizontal: 12 },
  switchBtn: { alignItems: 'center' },
  switchText: { fontSize: 14, color: COLORS.textMedium },
  switchTextBold: { color: COLORS.teal, fontWeight: '700' },
});