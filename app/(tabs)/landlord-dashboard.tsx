import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const COLORS = {
  background: '#EAE6DD',
  teal: '#2A5C59',
  tealDark: '#1E4442',
  gold: '#C4952A',
  coral: '#E06449',
  white: '#FFFFFF',
  textDark: '#1A2A2A',
  textMedium: '#444444',
  textLight: '#888888',
  chipBg: '#E4DED3',
  border: '#D5CFC4',
};

export default function LandlordDashboard() {
  const router = useRouter();
  const [landlord, setLandlord] = useState<any>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/(tabs)/login' as any); return; }

      const { data: landlordData } = await supabase
        .from('landlords')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setLandlord(landlordData);

      const { data: propertiesData } = await supabase
        .from('properties')
        .select('*')
        .eq('landlord_id', session.user.id)
        .order('created_at', { ascending: false });
      setProperties(propertiesData || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(tabs)' as any);
  };

  const handleDeleteProperty = async (id: string) => {
    Alert.alert('Delete Property', 'Are you sure you want to delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await supabase.from('properties').delete().eq('id', id);
          fetchData();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back,</Text>
            <Text style={styles.headerName}>
              {landlord?.first_name} {landlord?.last_name} 🏢
            </Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{properties.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.property_type === 'Boys').length}
            </Text>
            <Text style={styles.statLabel}>Boys</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.property_type === 'Girls').length}
            </Text>
            <Text style={styles.statLabel}>Girls</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {properties.filter(p => p.property_type === 'Family').length}
            </Text>
            <Text style={styles.statLabel}>Family</Text>
          </View>
        </View>

        {/* Add New Listing Button */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/add-property-step1' as any)}
          >
            <Text style={styles.addBtnText}>+ Add New Property</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.messagesBtn}
            onPress={() => router.push('/(tabs)/conversations' as any)}
          >
            <Text style={styles.messagesBtnText}>💬 Messages</Text>
          </TouchableOpacity>
        </View>

        {/* My Listings */}
        <Text style={styles.sectionTitle}>My Listings</Text>

        {properties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏠</Text>
            <Text style={styles.emptyTitle}>No listings yet</Text>
            <Text style={styles.emptySubtitle}>Add your first property listing!</Text>
          </View>
        ) : (
          properties.map((property) => (
            <View key={property.id} style={styles.propertyCard}>
              {property.cover_photo ? (
                <Image
                  source={{ uri: property.cover_photo }}
                  style={styles.propertyImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.propertyImagePlaceholder}>
                  <Text style={styles.propertyImagePlaceholderText}>🏠 No Photo</Text>
                </View>
              )}
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>{property.title}</Text>
                <Text style={styles.propertyPrice}>₹{property.price}/month</Text>
                <Text style={styles.propertyDetail}>📍 {property.city}, {property.state}</Text>
                <Text style={styles.propertyDetail}>🛏 {property.rooms} Room(s) • {property.property_type}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteProperty(property.id)}
                >
                  <Text style={styles.deleteBtnText}>🗑 Delete Listing</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 20,
    backgroundColor: COLORS.teal,
  },
  headerGreeting: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  headerName: { fontSize: 20, fontWeight: '700', color: COLORS.white },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14,
    paddingVertical: 8, borderRadius: 8,
  },
  logoutText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 20, paddingHorizontal: 12,
  },
  statCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12,
    alignItems: 'center', flex: 1, marginHorizontal: 3,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statNumber: { fontSize: 28, fontWeight: '700', color: COLORS.teal },
  statLabel: { fontSize: 11, color: COLORS.textMedium, marginTop: 4, textAlign: 'center' },
  addBtn: {
    backgroundColor: COLORS.coral, marginHorizontal: 16, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginBottom: 24,
  },
  addBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  sectionTitle: {
    fontSize: 20, fontWeight: '700', color: COLORS.tealDark,
    marginHorizontal: 16, marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center', paddingVertical: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 6 },
  emptySubtitle: { fontSize: 14, color: COLORS.textLight },
  propertyCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginBottom: 16,
    borderRadius: 16, overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  propertyImage: { width: '100%', height: 180 },
  propertyImagePlaceholder: {
    width: '100%', height: 180, backgroundColor: COLORS.chipBg,
    justifyContent: 'center', alignItems: 'center',
  },
  propertyImagePlaceholderText: { fontSize: 16, color: COLORS.textLight },
  propertyInfo: { padding: 16 },
  propertyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.tealDark, marginBottom: 4 },
  propertyPrice: { fontSize: 16, fontWeight: '700', color: COLORS.coral, marginBottom: 8 },
  propertyDetail: { fontSize: 13, color: COLORS.textMedium, marginBottom: 4 },
  deleteBtn: {
    marginTop: 12, paddingVertical: 8, alignItems: 'center',
    borderRadius: 8, borderWidth: 1, borderColor: '#D9534F',
  },
  deleteBtnText: { color: '#D9534F', fontWeight: '600', fontSize: 13 },

  actionRow: { marginHorizontal: 16, marginBottom: 24 },
  messagesBtn: {
    backgroundColor: COLORS.white, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 10,
    borderWidth: 1.5, borderColor: COLORS.teal,
  },
  messagesBtnText: { color: COLORS.teal, fontSize: 15, fontWeight: '700' },
});