import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Modal,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const heroBg = require('../../assets/images/hero-bg.jpg');

export default function HomeScreen() {
  const router = useRouter();

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('Any type');
  const [peopleCount, setPeopleCount] = useState('');

  // ── CALENDAR STATES ──
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectingDate, setSelectingDate] = useState<'checkin' | 'checkout'>('checkin');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const [firstName, setFirstName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

  const animatedScale = useRef(new Animated.Value(1)).current;

  const animatePress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const propertyTypes = ['Any type', 'Girls', 'Boys', 'Family'];

  // ── FETCH PROPERTIES ──
  useFocusEffect(
    useCallback(() => {
      fetchProperties();
    }, [])
  );

  const fetchProperties = async () => {
    setPropertiesLoading(true);
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });
    setProperties(data || []);
    setPropertiesLoading(false);
  };

  // ── CHECK USER SESSION ──
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('first_name')
          .eq('id', session.user.id)
          .single();
        if (tenant) {
          setFirstName(tenant.first_name);
          setUserRole('tenant');
          return;
        }
        const { data: landlord } = await supabase
          .from('landlords')
          .select('first_name')
          .eq('id', session.user.id)
          .single();
        if (landlord) {
          setFirstName(landlord.first_name);
          setUserRole('landlord');
          return;
        }
      } else {
        setFirstName(null);
        setUserRole(null);
      }
    };
    checkUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── SEARCH ──
  const handleSearch = () => {
    setSearchQuery(searchText);
  };

  // ── FORMAT DATE ──
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ── DATES LABEL ──
  const datesLabel = () => {
    if (checkInDate && checkOutDate) {
      return `${formatDate(checkInDate)} → ${formatDate(checkOutDate)}`;
    } else if (checkInDate) {
      return `From ${formatDate(checkInDate)}`;
    }
    return 'Dates';
  };

  // ── OPEN CALENDAR ──
  const openCalendar = (type: 'checkin' | 'checkout') => {
    setSelectingDate(type);
    setTempDate(
      type === 'checkin'
        ? checkInDate || new Date()
        : checkOutDate || checkInDate || new Date()
    );
    setShowCalendar(true);
  };

  // ── ON DATE CHANGE ──
  const onDateChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowCalendar(false);
      if (selectedDate) {
        if (selectingDate === 'checkin') {
          setCheckInDate(selectedDate);
          setCheckOutDate(null);
        } else {
          setCheckOutDate(selectedDate);
        }
      }
    } else {
      if (selectedDate) setTempDate(selectedDate);
    }
  };

  // ── CONFIRM DATE (iOS) ──
  const confirmDate = () => {
    if (selectingDate === 'checkin') {
      setCheckInDate(tempDate);
      setCheckOutDate(null);
    } else {
      setCheckOutDate(tempDate);
    }
    setShowCalendar(false);
  };

  // ── FILTERED PROPERTIES ──
  const filteredProperties = properties.filter(p =>
    (
      selectedType === 'Any type' ||
      p.property_type === selectedType ||
      p.property_type === 'Any'  // ✅ Show "Any type" properties in all sections
    ) &&
    (
      p?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      searchQuery === ''
    )
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.logoRow}
            onPress={() => router.push('/(tabs)' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>⌂</Text>
            </View>
            <Text style={styles.logoText}>Rent Now</Text>
          </TouchableOpacity>

          <View style={styles.authRow}>
            {firstName ? (
              <View style={styles.authRow}>
                {firstName && (
                  <TouchableOpacity
                    style={styles.messagesBtn}
                    onPress={() => router.push('/(tabs)/conversations' as any)}
                  >
                    <Text style={styles.messagesBtnText}>💬</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.signupBtn}
                  onPress={() => {
                    Alert.alert(
                      `👤 ${firstName}`,
                      'What would you like to do?',
                      [
                        {
                          text: userRole === 'landlord' ? '🏢 My Dashboard' : '🏠 My Profile',
                          onPress: () => {
                            if (userRole === 'landlord') {
                              router.push('/(tabs)/landlord-dashboard' as any);
                            } else {
                              router.push('/(tabs)/tenant-profile' as any);
                            }
                          },
                        },
                        {
                          text: '🚪 Log Out',
                          style: 'destructive',
                          onPress: async () => {
                            await supabase.auth.signOut();
                            setFirstName(null);
                            setUserRole(null);
                          },
                        },
                        { text: 'Cancel', style: 'cancel' },
                      ]
                    );
                  }}
                >
                  <Text style={styles.signupText}>👤 {firstName}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.loginBtn}
                  onPress={() => router.push({
                    pathname: '/(tabs)/who-are-you' as any,
                    params: { action: 'login' },
                  })}
                >
                  <Text style={styles.loginText}>Log in</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.signupBtn}
                  onPress={() => router.push({
                    pathname: '/(tabs)/who-are-you' as any,
                    params: { action: 'signup' },
                  })}
                >
                  <Text style={styles.signupText}>Sign up</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ───── HERO WITH BACKGROUND IMAGE ───── */}
        <ImageBackground
          source={heroBg}
          style={styles.heroBg}
          imageStyle={{ opacity: 0.3 }}
          resizeMode="cover"
        >
          <View style={styles.hero}>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>⌂  RENTALS MADE SIMPLE</Text>
            </View>

            <Text style={styles.heroTitle}>
              Find Your Next{'\n'}
              <Text style={styles.heroItalic}>Perfect </Text>
              <Text style={styles.heroTitleBold}>Home</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              Browse verified rentals across India. Connect directly with
              landlords — no middlemen, no hidden fees.
            </Text>

            {/* ── SEARCH BAR ── */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>📍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by city or title..."
                placeholderTextColor={COLORS.textLight}
                value={searchText}
                onChangeText={setSearchText}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
              />
              <View style={styles.searchDivider} />

              {/* ── DATES BUTTON ── */}
              <TouchableOpacity
                style={styles.datesBtn}
                onPress={() => openCalendar('checkin')}
              >
                <Text style={styles.searchIcon}>📅</Text>
                <Text
                  style={[
                    styles.datesText,
                    (checkInDate || checkOutDate) && styles.datesTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {datesLabel()}
                </Text>
              </TouchableOpacity>

              {/* ── ANIMATED SEARCH BUTTON ── */}
              <TouchableOpacity
                style={styles.searchBtn}
                onPress={() => animatePress(handleSearch)}
                activeOpacity={0.8}
              >
                <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
                  <Text style={styles.searchBtnText}>Search</Text>
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* ── SELECTED DATES DISPLAY ── */}
            {(checkInDate || checkOutDate) && (
              <View style={styles.selectedDatesRow}>
                <TouchableOpacity
                  style={styles.dateChip}
                  onPress={() => openCalendar('checkin')}
                >
                  <Text style={styles.dateChipLabel}>Check-in</Text>
                  <Text style={styles.dateChipValue}>
                    {checkInDate ? formatDate(checkInDate) : 'Select'}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.dateArrow}>→</Text>

                <TouchableOpacity
                  style={styles.dateChip}
                  onPress={() => openCalendar('checkout')}
                >
                  <Text style={styles.dateChipLabel}>Check-out</Text>
                  <Text style={styles.dateChipValue}>
                    {checkOutDate ? formatDate(checkOutDate) : 'Select'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.clearDatesBtn}
                  onPress={() => { setCheckInDate(null); setCheckOutDate(null); }}
                >
                  <Text style={styles.clearDatesText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ImageBackground>

        {/* ── CALENDAR MODAL (iOS) ── */}
        {Platform.OS === 'ios' && (
          <Modal visible={showCalendar} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>
                  {selectingDate === 'checkin' ? '📅 Select Check-in Date' : '📅 Select Check-out Date'}
                </Text>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="spinner"
                  minimumDate={
                    selectingDate === 'checkout' && checkInDate
                      ? checkInDate
                      : new Date()
                  }
                  onChange={onDateChange}
                  textColor={COLORS.tealDark}
                />
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowCalendar(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmBtn}
                    onPress={confirmDate}
                  >
                    <Text style={styles.modalConfirmText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ── CALENDAR PICKER (Android) ── */}
        {Platform.OS === 'android' && showCalendar && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            minimumDate={
              selectingDate === 'checkout' && checkInDate
                ? checkInDate
                : new Date()
            }
            onChange={onDateChange}
          />
        )}

        {/* ───── STATS ───── */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{properties.length}+</Text>
            <Text style={styles.statLabel}>LISTINGS</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>DIRECT CONTACT</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹0</Text>
            <Text style={styles.statLabel}>BROKERAGE</Text>
          </View>
        </View>

        {/* ───── ALL PROPERTIES CARD ───── */}
        <View style={styles.propertiesCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>All Properties</Text>
            <View style={styles.listingsBadge}>
              <Text style={styles.listingsBadgeText}>{properties.length} listings</Text>
            </View>
          </View>

          <View style={styles.chipsRow}>
            {propertyTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, selectedType === type && styles.chipActive]}
                onPress={() => setSelectedType(type)}
              >
                <Text style={[styles.chipText, selectedType === type && styles.chipTextActive]}>
                  {type === 'Girls' ? '👤 ' : type === 'Boys' ? '👤 ' : type === 'Family' ? '👥 ' : ''}
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.peopleRow}>
            <Text style={styles.peopleLabel}>PEOPLE</Text>
            <TextInput
              style={styles.peopleInput}
              placeholder="How many?"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
              value={peopleCount}
              onChangeText={setPeopleCount}
            />
          </View>
        </View>

        {/* ───── PROPERTIES LIST ───── */}
        {propertiesLoading ? (
          <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 30 }} />
        ) : filteredProperties.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? `No results for "${searchQuery}"` : 'No properties found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different city or title' : 'Be the first to list a property!'}
            </Text>
          </View>
        ) : (
          filteredProperties.map((property) => (
            <TouchableOpacity
              key={property.id}
              style={styles.propertyCard}
              activeOpacity={0.85}
              onPress={() => {
                if (!firstName) {
                  Alert.alert(
                    '🔒 Login Required',
                    'Please log in to view property details.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Log In',
                        onPress: () => router.push({
                          pathname: '/(tabs)/who-are-you' as any,
                          params: { action: 'login' },
                        }),
                      },
                    ]
                  );
                  return;
                }
                router.push({
                  pathname: '/(tabs)/property-detail' as any,
                  params: { id: property.id },
                });
              }}
            >
              {property.cover_photo ? (
                <Image
                  source={{ uri: property.cover_photo }}
                  style={styles.propertyCardImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.propertyCardImagePlaceholder}>
                  <Text style={{ fontSize: 32 }}>🏠</Text>
                </View>
              )}
              <View style={styles.propertyCardInfo}>
                <Text style={styles.propertyCardTitle}>{property.title}</Text>
                <Text style={styles.propertyCardPrice}>₹{property.price}/month</Text>
                <Text style={styles.propertyCardLocation}>📍 {property.city}, {property.state}</Text>
                <View style={styles.propertyCardTags}>
                  <View style={styles.propertyCardTag}>
                    <Text style={styles.propertyCardTagText}>{property.property_type}</Text>
                  </View>
                  <View style={styles.propertyCardTag}>
                    <Text style={styles.propertyCardTagText}>{property.rooms} Room(s)</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* ───── FOOTER ───── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2026 Rent Now — Rental Marketplace. Built with Supabase + React.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/admin-login' as any)}
            style={styles.adminAccessBtn}
          >
            <Text style={styles.adminAccessText}>⚙️ Admin Access</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: COLORS.white,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  logoIconText: { color: COLORS.white, fontSize: 18 },
  logoText: { fontSize: 20, fontWeight: '700', color: COLORS.teal },
  authRow: { flexDirection: 'row', alignItems: 'center' },
  loginBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  loginText: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
  signupBtn: {
    backgroundColor: COLORS.teal, paddingHorizontal: 18,
    paddingVertical: 9, borderRadius: 8, marginLeft: 8,
  },
  signupText: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  dashboardBtn: {
    backgroundColor: COLORS.chipBg, paddingHorizontal: 12,
    paddingVertical: 8, borderRadius: 8, marginRight: 8,
  },
  dashboardBtnText: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },

  // Hero
  heroBg: { width: '100%' },
  hero: { paddingHorizontal: 22, paddingTop: 32, paddingBottom: 28 },
  badge: {
    alignSelf: 'flex-start', borderWidth: 1.5, borderColor: COLORS.teal,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 18,
  },
  badgeText: { color: COLORS.teal, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  heroTitle: { fontSize: 36, fontWeight: '700', color: COLORS.tealDark, lineHeight: 44, marginBottom: 14 },
  heroItalic: { fontStyle: 'italic', fontWeight: '400', color: COLORS.tealDark, fontSize: 36 },
  heroTitleBold: { fontWeight: '700', color: COLORS.tealDark, fontSize: 36 },
  heroSubtitle: { fontSize: 15, color: COLORS.textMedium, lineHeight: 23, marginBottom: 24 },

  // Search Bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 50, paddingHorizontal: 16, paddingVertical: 6,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  searchIcon: { fontSize: 16, marginRight: 4 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark, paddingVertical: 8 },
  searchDivider: { width: 1, height: 24, backgroundColor: COLORS.border, marginHorizontal: 10 },
  datesBtn: { flexDirection: 'row', alignItems: 'center', maxWidth: 90 },
  datesText: { fontSize: 13, color: COLORS.textMedium, marginLeft: 2, marginRight: 8 },
  datesTextActive: { color: COLORS.teal, fontWeight: '600' },
  searchBtn: {
    backgroundColor: COLORS.coral, borderRadius: 50,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  searchBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  // Selected Dates Row
  selectedDatesRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12, padding: 10,
  },
  dateChip: { flex: 1, alignItems: 'center' },
  dateChipLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '600', letterSpacing: 0.5 },
  dateChipValue: { fontSize: 13, color: COLORS.tealDark, fontWeight: '700', marginTop: 2 },
  dateArrow: { fontSize: 16, color: COLORS.teal, marginHorizontal: 8 },
  clearDatesBtn: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.chipBg, justifyContent: 'center', alignItems: 'center',
  },
  clearDatesText: { fontSize: 12, color: COLORS.textMedium, fontWeight: '700' },

  // Calendar Modal (iOS)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: COLORS.white, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, padding: 24, paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 17, fontWeight: '700', color: COLORS.tealDark,
    marginBottom: 12, textAlign: 'center',
  },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, gap: 12 },
  modalCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, color: COLORS.textMedium, fontWeight: '600' },
  modalConfirmBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    backgroundColor: COLORS.teal, alignItems: 'center',
  },
  modalConfirmText: { fontSize: 15, color: COLORS.white, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 28, paddingHorizontal: 20,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 30, fontWeight: '700', color: COLORS.gold },
  statLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMedium, marginTop: 4, letterSpacing: 0.5 },

  // Properties Card
  propertiesCard: {
    marginHorizontal: 16, backgroundColor: COLORS.white, borderRadius: 16,
    padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 26, fontWeight: '700', color: COLORS.tealDark, marginRight: 12 },
  listingsBadge: { backgroundColor: COLORS.chipBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  listingsBadgeText: { fontSize: 13, color: COLORS.textMedium, fontWeight: '500' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  chip: { backgroundColor: COLORS.chipBg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 10, marginBottom: 10 },
  chipActive: { backgroundColor: COLORS.teal },
  chipText: { fontSize: 14, color: COLORS.textDark, fontWeight: '500' },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  peopleRow: { flexDirection: 'row', alignItems: 'center' },
  peopleLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, letterSpacing: 0.5, marginRight: 14 },
  peopleInput: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, color: COLORS.textDark,
  },

  // Property Cards
  propertyCard: {
    backgroundColor: COLORS.white, marginHorizontal: 16,
    marginBottom: 16, borderRadius: 16, overflow: 'hidden',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  propertyCardImage: { width: '100%', height: 180 },
  propertyCardImagePlaceholder: {
    width: '100%', height: 180, backgroundColor: COLORS.chipBg,
    justifyContent: 'center', alignItems: 'center',
  },
  propertyCardInfo: { padding: 14 },
  propertyCardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.tealDark, marginBottom: 4 },
  propertyCardPrice: { fontSize: 15, fontWeight: '700', color: COLORS.coral, marginBottom: 6 },
  propertyCardLocation: { fontSize: 13, color: COLORS.textMedium, marginBottom: 8 },
  propertyCardTags: { flexDirection: 'row' },
  propertyCardTag: {
    backgroundColor: COLORS.chipBg, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4, marginRight: 8,
  },
  propertyCardTagText: { fontSize: 12, color: COLORS.tealDark, fontWeight: '600' },

  // Empty State
  emptyState: { alignItems: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textDark, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 15, color: COLORS.textLight, textAlign: 'center' },

  // Footer
  footer: {
    paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center',
    borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 20,
  },
  footerText: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  adminAccessBtn: { marginTop: 10, paddingVertical: 6 },
  adminAccessText: { fontSize: 11, color: COLORS.textLight, textAlign: 'center' },

  messagesBtn: {
    backgroundColor: COLORS.chipBg, width: 36, height: 36,
    borderRadius: 18, justifyContent: 'center',
    alignItems: 'center', marginRight: 6,
  },
  messagesBtnText: { fontSize: 16 },
});