import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

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

export default function TenantSignupStep2() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [aadhaar, setAadhaar] = useState('');
  const [error, setError] = useState('');

  const handleNext = () => {
    if (!aadhaar) { setError('Aadhaar number is required'); return; }
    if (!/^\d{12}$/.test(aadhaar)) { setError('Enter valid 12-digit Aadhaar number'); return; }
    setError('');
    router.push({
      pathname: '/(tabs)/tenant-signup-step3' as any,
      params: { ...params, aadhaar },
    });
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
          <View style={styles.stepActive}><Text style={styles.stepActiveText}>2</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>3</Text></View>
        </View>

        <Text style={styles.heading}>Aadhaar Details</Text>
        <Text style={styles.subheading}>Step 2 of 3 — Enter your Aadhaar number</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔒 Your Aadhaar details are encrypted and stored securely. Used only for identity verification.
          </Text>
        </View>

        <Text style={styles.label}>Aadhaar Number</Text>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          placeholder="Enter 12-digit Aadhaar number"
          placeholderTextColor={COLORS.textLight}
          value={aadhaar}
          onChangeText={(t) => { setAadhaar(t); setError(''); }}
          keyboardType="phone-pad"
          maxLength={12}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next →</Text>
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
  stepInactive: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepInactiveText: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMedium, marginBottom: 24 },
  infoBox: {
    backgroundColor: '#E8F4F3', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.teal, marginBottom: 24,
  },
  infoText: { fontSize: 13, color: COLORS.teal, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, letterSpacing: 0.3 },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 15, color: COLORS.textDark, marginBottom: 6,
  },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 10 },
  nextBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});