import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

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
};

export default function WhoAreYouScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action: 'login' | 'signup' }>();
  const [selected, setSelected] = useState<'tenant' | 'landlord' | null>(null);

  const handleContinue = () => {
    if (!selected) return;
    if (action === 'signup' && selected === 'tenant') {
      router.push('/(tabs)/tenant-signup-step1' as any);
    } else if (action === 'signup' && selected === 'landlord') {
      router.push('/(tabs)/landlord-signup-step1' as any);
    } else {
      router.push({
        pathname: '/(tabs)/login' as any,
        params: { role: selected },
      });
    }
  };

  // ✅ Direct click on card redirects immediately
  const handleCardPress = (role: 'tenant' | 'landlord') => {
    setSelected(role);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.container}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Logo */}
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

        {/* Heading */}
        <Text style={styles.heading}>Who are you?</Text>
        <Text style={styles.subheading}>
          Tell us who you are so we can personalize your experience.
        </Text>

        {/* Role Cards */}
        <TouchableOpacity
          style={[styles.roleCard, selected === 'tenant' && styles.roleCardActive]}
          onPress={() => handleCardPress('tenant')}
          activeOpacity={0.85}
        >
          <Text style={styles.roleEmoji}>🏠</Text>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleTitle, selected === 'tenant' && styles.roleTitleActive]}>
              Tenant
            </Text>
            <Text style={styles.roleDesc}>
              I'm looking for a place to rent
            </Text>
          </View>
          <View style={[styles.radioCircle, selected === 'tenant' && styles.radioCircleActive]}>
            {selected === 'tenant' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, selected === 'landlord' && styles.roleCardActive]}
          onPress={() => handleCardPress('landlord')}
          activeOpacity={0.85}
        >
          <Text style={styles.roleEmoji}>🏢</Text>
          <View style={styles.roleInfo}>
            <Text style={[styles.roleTitle, selected === 'landlord' && styles.roleTitleActive]}>
              Landlord
            </Text>
            <Text style={styles.roleDesc}>
              I want to list my property for rent
            </Text>
          </View>
          <View style={[styles.radioCircle, selected === 'landlord' && styles.radioCircleActive]}>
            {selected === 'landlord' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Single Button */}
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
        >
          <Text style={styles.continueBtnText}>
            {action === 'login' ? 'Log In' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          You can always change your role later in settings.
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { marginBottom: 24 },
  backText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 36 },
  logoIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.teal, justifyContent: 'center',
    alignItems: 'center', marginRight: 10,
  },
  logoIconText: { color: COLORS.white, fontSize: 18 },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  heading: { fontSize: 30, fontWeight: '700', color: COLORS.tealDark, marginBottom: 10 },
  subheading: { fontSize: 15, color: COLORS.textMedium, lineHeight: 22, marginBottom: 32 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, marginBottom: 16,
    borderWidth: 2, borderColor: 'transparent',
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  roleCardActive: {
    borderColor: COLORS.teal,
    backgroundColor: '#F0F7F6',
  },
  roleEmoji: { fontSize: 32, marginRight: 16 },
  roleInfo: { flex: 1 },
  roleTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textDark, marginBottom: 4 },
  roleTitleActive: { color: COLORS.teal },
  roleDesc: { fontSize: 13, color: COLORS.textMedium },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioCircleActive: { borderColor: COLORS.teal },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: COLORS.teal },
  continueBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 12,
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footerNote: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginTop: 20 },
});