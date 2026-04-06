import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, FlatList, SafeAreaView, TextInput,
} from 'react-native';
import { indiaData, states } from '../lib/indiaData';

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

interface Props {
  selectedState: string;
  selectedCity: string;
  onStateChange: (state: string) => void;
  onCityChange: (city: string) => void;
  stateError?: string;
  cityError?: string;
}

export default function StateCityPicker({
  selectedState,
  selectedCity,
  onStateChange,
  onCityChange,
  stateError,
  cityError,
}: Props) {
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');

  const filteredStates = states.filter(s =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const cities = selectedState ? indiaData[selectedState] || [] : [];
  const filteredCities = cities.filter(c =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleStateSelect = (state: string) => {
    onStateChange(state);
    onCityChange('');
    setShowStateModal(false);
    setStateSearch('');
  };

  const handleCitySelect = (city: string) => {
    onCityChange(city);
    setShowCityModal(false);
    setCitySearch('');
  };

  return (
    <View>
      {/* State Dropdown */}
      <Text style={styles.label}>State</Text>
      <TouchableOpacity
        style={[styles.dropdown, stateError ? styles.dropdownError : null]}
        onPress={() => setShowStateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, !selectedState && styles.placeholder]}>
          {selectedState || 'Select your state'}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {stateError ? <Text style={styles.errorText}>{stateError}</Text> : null}

      {/* City Dropdown */}
      <Text style={styles.label}>City</Text>
      <TouchableOpacity
        style={[
          styles.dropdown,
          !selectedState && styles.dropdownDisabled,
          cityError ? styles.dropdownError : null,
        ]}
        onPress={() => selectedState && setShowCityModal(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.dropdownText, !selectedCity && styles.placeholder]}>
          {selectedCity || (selectedState ? 'Select your city' : 'Select state first')}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>
      {cityError ? <Text style={styles.errorText}>{cityError}</Text> : null}

      {/* State Modal */}
      <Modal visible={showStateModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => { setShowStateModal(false); setStateSearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search state..."
              placeholderTextColor={COLORS.textLight}
              value={stateSearch}
              onChangeText={setStateSearch}
            />
            <FlatList
              data={filteredStates}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedState === item && styles.optionItemActive,
                  ]}
                  onPress={() => handleStateSelect(item)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedState === item && styles.optionTextActive,
                  ]}>
                    {item}
                  </Text>
                  {selectedState === item && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* City Modal */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select City</Text>
              <TouchableOpacity onPress={() => { setShowCityModal(false); setCitySearch(''); }}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city..."
              placeholderTextColor={COLORS.textLight}
              value={citySearch}
              onChangeText={setCitySearch}
            />
            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedCity === item && styles.optionItemActive,
                  ]}
                  onPress={() => handleCitySelect(item)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedCity === item && styles.optionTextActive,
                  ]}>
                    {item}
                  </Text>
                  {selectedCity === item && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13, fontWeight: '700', color: COLORS.textDark,
    marginBottom: 8, letterSpacing: 0.3,
  },
  dropdown: {
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5,
    borderColor: COLORS.border, paddingHorizontal: 16, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  dropdownDisabled: { backgroundColor: '#F5F2ED', opacity: 0.6 },
  dropdownError: { borderColor: COLORS.error },
  dropdownText: { fontSize: 15, color: COLORS.textDark, flex: 1 },
  placeholder: { color: COLORS.textLight },
  arrow: { fontSize: 12, color: COLORS.textMedium },
  errorText: { fontSize: 12, color: COLORS.error, marginBottom: 10 },
  modalContainer: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, paddingTop: 8,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.tealDark },
  modalClose: { fontSize: 18, color: COLORS.textMedium, fontWeight: '600' },
  searchInput: {
    marginHorizontal: 16, marginVertical: 12, backgroundColor: '#F5F2ED',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: COLORS.textDark, borderWidth: 1, borderColor: COLORS.border,
  },
  optionItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F0EDE8',
  },
  optionItemActive: { backgroundColor: '#F0F7F6' },
  optionText: { fontSize: 15, color: COLORS.textDark },
  optionTextActive: { color: COLORS.teal, fontWeight: '600' },
  checkmark: { fontSize: 16, color: COLORS.teal, fontWeight: '700' },
});