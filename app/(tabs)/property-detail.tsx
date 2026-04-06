import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, Image,
  ActivityIndicator, Alert, Dimensions,
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
  border: '#D5CFC4',
  chipBg: '#E4DED3',
};

const { width } = Dimensions.get('window');

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [property, setProperty] = useState<any>(null);
  const [landlord, setLandlord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchProperty();
  }, []);

  const fetchProperty = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      if (session?.user) {
        setCurrentUser(session.user);
        // Check role
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('id', session.user.id)
          .single();
        if (tenant) setUserRole('tenant');
        else setUserRole('landlord');
      }

      const { data } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();
      setProperty(data);

      if (data) {
        const { data: landlordData } = await supabase
          .from('landlords')
          .select('id, first_name, last_name')
          .eq('id', data.landlord_id)
          .single();
        setLandlord(landlordData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser || !property || !landlord) return;
    setChatLoading(true);
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', currentUser.id)
        .eq('landlord_id', landlord.id)
        .eq('property_id', property.id)
        .single();

      let conversationId = existing?.id;

      if (!conversationId) {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            tenant_id: currentUser.id,
            landlord_id: landlord.id,
            property_id: property.id,
          })
          .select('id')
          .single();

        if (error) throw error;
        conversationId = newConv.id;
      }

      router.push({
        pathname: '/(tabs)/chat' as any,
        params: {
          conversationId,
          propertyTitle: property.title,
          otherPersonName: `${landlord.first_name} ${landlord.last_name}`,
        },
      });
    } catch (error: any) {
      Alert.alert('❌ Error', 'Failed to start chat. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 100, color: COLORS.textMedium }}>
          Property not found
        </Text>
      </SafeAreaView>
    );
  }

  const allPhotos = [property.cover_photo, ...(property.photos || [])].filter(Boolean);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Photo Carousel */}
        {allPhotos.length > 0 && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: allPhotos[currentPhoto] }}
              style={styles.mainPhoto}
              resizeMode="cover"
            />
            <View style={styles.photoCounter}>
              <Text style={styles.photoCounterText}>
                {currentPhoto + 1} / {allPhotos.length}
              </Text>
            </View>
            <View style={styles.photoNav}>
              {currentPhoto > 0 && (
                <TouchableOpacity
                  style={styles.photoNavBtn}
                  onPress={() => setCurrentPhoto(p => p - 1)}
                >
                  <Text style={styles.photoNavText}>‹</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              {currentPhoto < allPhotos.length - 1 && (
                <TouchableOpacity
                  style={styles.photoNavBtn}
                  onPress={() => setCurrentPhoto(p => p + 1)}
                >
                  <Text style={styles.photoNavText}>›</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
              {allPhotos.map((photo, index) => (
                <TouchableOpacity key={index} onPress={() => setCurrentPhoto(index)}>
                  <Image
                    source={{ uri: photo }}
                    style={[styles.thumbnail, currentPhoto === index && styles.thumbnailActive]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Property Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.propertyTitle}>{property.title}</Text>
          <Text style={styles.propertyPrice}>₹{property.price} / month</Text>

          {/* Tags */}
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>🏠 {property.property_type}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>🛏 {property.rooms} Room(s)</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Location</Text>
            <Text style={styles.sectionText}>{property.address}</Text>
            <Text style={styles.sectionText}>
              {property.city}, {property.state} - {property.pincode}
            </Text>
          </View>

          {/* Description */}
          {property.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Description</Text>
              <Text style={styles.sectionText}>{property.description}</Text>
            </View>
          ) : null}

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👤 Listed By</Text>
            {isLoggedIn && userRole === 'tenant' ? (
              <View style={styles.landlordCard}>
                <View style={styles.landlordInfo}>
                  <View style={styles.landlordAvatar}>
                    <Text style={styles.landlordAvatarText}>
                      {landlord?.first_name?.charAt(0)}{landlord?.last_name?.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.landlordName}>
                      {landlord?.first_name} {landlord?.last_name}
                    </Text>
                    <Text style={styles.landlordRole}>🏢 Landlord</Text>
                  </View>
                </View>
                {/* ✅ Chat button instead of phone number */}
                <TouchableOpacity
                  style={[styles.chatBtn, chatLoading && styles.chatBtnDisabled]}
                  onPress={handleStartChat}
                  disabled={chatLoading}
                >
                  {chatLoading
                    ? <ActivityIndicator color={COLORS.white} size="small" />
                    : <Text style={styles.chatBtnText}>💬 Chat with Landlord</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : isLoggedIn && userRole === 'landlord' ? (
              <View style={styles.landlordCard}>
                <Text style={styles.sectionText}>
                  This is your listed property.
                </Text>
              </View>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  🔒 Please log in as a tenant to contact the landlord
                </Text>
                <TouchableOpacity
                  style={styles.loginPromptBtn}
                  onPress={() => router.push({
                    pathname: '/(tabs)/who-are-you' as any,
                    params: { action: 'login' },
                  })}
                >
                  <Text style={styles.loginPromptBtnText}>Log In to Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  backBtn: { padding: 16 },
  backText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
  photoContainer: { backgroundColor: COLORS.textDark },
  mainPhoto: { width: width, height: 280 },
  photoCounter: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  photoCounterText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  photoNav: {
    position: 'absolute', top: 0, bottom: 40, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8,
  },
  photoNavBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)', width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center', alignItems: 'center',
  },
  photoNavText: { color: COLORS.white, fontSize: 24, fontWeight: '700' },
  thumbnailRow: { paddingHorizontal: 12, paddingVertical: 8 },
  thumbnail: {
    width: 60, height: 60, borderRadius: 8, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: COLORS.coral },
  infoContainer: { padding: 20 },
  propertyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  propertyPrice: { fontSize: 20, fontWeight: '700', color: COLORS.coral, marginBottom: 16 },
  tagsRow: { flexDirection: 'row', marginBottom: 20 },
  tag: {
    backgroundColor: COLORS.chipBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 10,
  },
  tagText: { fontSize: 13, color: COLORS.tealDark, fontWeight: '600' },
  section: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.tealDark, marginBottom: 8 },
  sectionText: { fontSize: 14, color: COLORS.textMedium, lineHeight: 22 },
  landlordCard: {},
  landlordInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  landlordAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  landlordAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  landlordName: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  landlordRole: { fontSize: 12, color: COLORS.textMedium, marginTop: 2 },
  chatBtn: {
    backgroundColor: COLORS.teal, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  chatBtnDisabled: { opacity: 0.6 },
  chatBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  loginPrompt: { alignItems: 'center' },
  loginPromptText: {
    fontSize: 14, color: COLORS.textMedium, textAlign: 'center', marginBottom: 16,
  },
  loginPromptBtn: {
    backgroundColor: COLORS.teal, borderRadius: 10,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  loginPromptBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});