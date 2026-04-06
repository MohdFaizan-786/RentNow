import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  chipBg: '#E4DED3',
};

const PROPERTY_TYPES = ['Boys', 'Girls', 'Family', 'Any'];

export default function AddPropertyStep1() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [rooms, setRooms] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!price) newErrors.price = 'Price is required';
    else if (isNaN(Number(price))) newErrors.price = 'Enter a valid price';
    if (!propertyType) newErrors.propertyType = 'Please select property type';
    if (!rooms) newErrors.rooms = 'Number of rooms is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!pincode) newErrors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(pincode)) newErrors.pincode = 'Enter valid 6-digit pincode';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    router.push({
      pathname: '/(tabs)/add-property-step2' as any,
      params: { title, price, propertyType, rooms, address, city, state, pincode, description },
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
        </View>

        <Text style={styles.heading}>Property Details</Text>
        <Text style={styles.subheading}>Step 1 of 2 — Basic information</Text>

        <Text style={styles.label}>Property Title</Text>
        <TextInput
          style={[styles.input, errors.title ? styles.inputError : null]}
          placeholder="e.g. Spacious 2BHK near Metro"
          placeholderTextColor={COLORS.textLight}
          value={title}
          onChangeText={(t) => { setTitle(t); setErrors(e => ({ ...e, title: '' })); }}
        />
        {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

        <Text style={styles.label}>Monthly Rent (₹)</Text>
        <TextInput
          style={[styles.input, errors.price ? styles.inputError : null]}
          placeholder="e.g. 8000"
          placeholderTextColor={COLORS.textLight}
          value={price}
          onChangeText={(t) => { setPrice(t); setErrors(e => ({ ...e, price: '' })); }}
          keyboardType="numeric"
        />
        {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}

        <Text style={styles.label}>Property Type</Text>
        <View style={styles.typeRow}>
          {PROPERTY_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, propertyType === type && styles.typeChipActive]}
              onPress={() => { setPropertyType(type); setErrors(e => ({ ...e, propertyType: '' })); }}
            >
              <Text style={[styles.typeChipText, propertyType === type && styles.typeChipTextActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.propertyType ? <Text style={styles.errorText}>{errors.propertyType}</Text> : null}

        <Text style={styles.label}>Number of Rooms</Text>
        <TextInput
          style={[styles.input, errors.rooms ? styles.inputError : null]}
          placeholder="e.g. 2"
          placeholderTextColor={COLORS.textLight}
          value={rooms}
          onChangeText={(t) => { setRooms(t); setErrors(e => ({ ...e, rooms: '' })); }}
          keyboardType="numeric"
        />
        {errors.rooms ? <Text style={styles.errorText}>{errors.rooms}</Text> : null}

        <Text style={styles.label}>Full Address</Text>
        <TextInput
          style={[styles.input, errors.address ? styles.inputError : null]}
          placeholder="House no, Street, Area"
          placeholderTextColor={COLORS.textLight}
          value={address}
          onChangeText={(t) => { setAddress(t); setErrors(e => ({ ...e, address: '' })); }}
        />
        {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

        <StateCityPicker
          selectedState={state}
          selectedCity={city}
          onStateChange={(s) => { setState(s); setErrors(e => ({ ...e, state: '' })); }}
          onCityChange={(c) => { setCity(c); setErrors(e => ({ ...e, city: '' })); }}
          stateError={errors.state}
          cityError={errors.city}
        />

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

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your property..."
          placeholderTextColor={COLORS.textLight}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next → Add Photos</Text>
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
  textArea: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 10 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  typeChip: {
    backgroundColor: COLORS.chipBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, marginBottom: 10,
  },
  typeChipActive: { backgroundColor: COLORS.teal },
  typeChipText: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  typeChipTextActive: { color: COLORS.white, fontWeight: '600' },
  nextBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});