import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import StateCityPicker from '../../components/StateCityPicker';

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

export default function LandlordSignupStep1() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^\d{10}$/.test(mobile)) newErrors.mobile = 'Enter valid 10-digit number';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!pincode) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!city.trim()) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) return;
    const { data } = await supabase
      .from('landlords')
      .select('email')
      .eq('email', email)
      .single();
    if (data) {
      Alert.alert('❌ Already Registered', 'This email is already registered. Please log in.');
      return;
    }
    router.push({
      pathname: '/(tabs)/landlord-signup-step2' as any,
      params: { firstName, lastName, email, mobile, address, pincode, state, city },
    });
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

        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>⌂</Text>
          </View>
          <Text style={styles.logoText}>Rent Now</Text>
        </View>

        <View style={styles.stepRow}>
          <View style={styles.stepActive}><Text style={styles.stepActiveText}>1</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>2</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepInactive}><Text style={styles.stepInactiveText}>3</Text></View>
        </View>

        <Text style={styles.heading}>Basic Details</Text>
        <Text style={styles.subheading}>Step 1 of 3 — Tell us about yourself</Text>

        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={[styles.input, errors.firstName ? styles.inputError : null]}
          placeholder="Enter your first name"
          placeholderTextColor={COLORS.textLight}
          value={firstName}
          onChangeText={(t) => { setFirstName(t); setErrors(e => ({ ...e, firstName: '' })); }}
        />
        {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={[styles.input, errors.lastName ? styles.inputError : null]}
          placeholder="Enter your last name"
          placeholderTextColor={COLORS.textLight}
          value={lastName}
          onChangeText={(t) => { setLastName(t); setErrors(e => ({ ...e, lastName: '' })); }}
        />
        {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, errors.email ? styles.inputError : null]}
          placeholder="you@example.com"
          placeholderTextColor={COLORS.textLight}
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors(e => ({ ...e, email: '' })); }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          style={[styles.input, errors.mobile ? styles.inputError : null]}
          placeholder="10-digit mobile number"
          placeholderTextColor={COLORS.textLight}
          value={mobile}
          onChangeText={(t) => { setMobile(t); setErrors(e => ({ ...e, mobile: '' })); }}
          keyboardType="phone-pad"
          maxLength={10}
        />
        {errors.mobile ? <Text style={styles.errorText}>{errors.mobile}</Text> : null}

        <Text style={styles.label}>Address</Text>
        <TextInput
          style={[styles.input, errors.address ? styles.inputError : null]}
          placeholder="House no, Street, Area"
          placeholderTextColor={COLORS.textLight}
          value={address}
          onChangeText={(t) => { setAddress(t); setErrors(e => ({ ...e, address: '' })); }}
        />
        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

        <Text style={styles.label}>Pincode</Text>
        <TextInput
          style={[styles.input, errors.pincode ? styles.inputError : null]}
          placeholder="6-digit pincode"
          placeholderTextColor={COLORS.textLight}
          value={pincode}
          onChangeText={(t) => { setPincode(t); setErrors(e => ({ ...e, pincode: '' })); }}
          keyboardType="phone-pad"
          maxLength={6}
        />
        {errors.pincode ? <Text style={styles.errorText}>{errors.pincode}</Text> : null}

        <StateCityPicker
          selectedState={state}
          selectedCity={city}
          onStateChange={(s) => { setState(s); setErrors(e => ({ ...e, state: '' })); }}
          onCityChange={(c) => { setCity(c); setErrors(e => ({ ...e, city: '' })); }}
          stateError={errors.state}
          cityError={errors.city}
        />

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
  stepInactive: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  stepInactiveText: { color: COLORS.textLight, fontWeight: '700', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8 },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMedium, marginBottom: 24 },
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