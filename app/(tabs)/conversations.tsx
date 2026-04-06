import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, FlatList, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
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
  chipBg: '#E4DED3',
  coral: '#E06449',
};

export default function Conversations() {
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/(tabs)' as any);
        return;
      }

      const userId = session.user.id;
      setCurrentUserId(userId);

      // Check if tenant
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .eq('id', userId)
        .single();

      const role = tenantData ? 'tenant' : 'landlord';
      setUserRole(role);

      if (role === 'tenant') {
        // ✅ Tenant: fetch conversations and get landlord names separately
        const { data: convData, error } = await supabase
          .from('conversations')
          .select('id, property_id, landlord_id, tenant_id, created_at')
          .eq('tenant_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch additional data for each conversation
        const enriched = await Promise.all(
          (convData || []).map(async (conv) => {
            const [propertyRes, landlordRes] = await Promise.all([
              supabase.from('properties').select('title, city').eq('id', conv.property_id).single(),
              supabase.from('landlords').select('first_name, last_name').eq('id', conv.landlord_id).single(),
            ]);
            return {
              ...conv,
              property: propertyRes.data,
              otherPerson: landlordRes.data,
            };
          })
        );
        setConversations(enriched);

      } else {
        // ✅ Landlord: fetch conversations and get tenant names separately
        const { data: convData, error } = await supabase
          .from('conversations')
          .select('id, property_id, landlord_id, tenant_id, created_at')
          .eq('landlord_id', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const enriched = await Promise.all(
          (convData || []).map(async (conv) => {
            const [propertyRes, tenantRes] = await Promise.all([
              supabase.from('properties').select('title, city').eq('id', conv.property_id).single(),
              supabase.from('tenants').select('first_name, last_name').eq('id', conv.tenant_id).single(),
            ]);
            return {
              ...conv,
              property: propertyRes.data,
              otherPerson: tenantRes.data,
            };
          })
        );
        setConversations(enriched);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderConversation = ({ item }: { item: any }) => {
    const name = `${item.otherPerson?.first_name || ''} ${item.otherPerson?.last_name || ''}`.trim();
    const initial = name?.charAt(0)?.toUpperCase() || '?';

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        activeOpacity={0.8}
        onPress={() => router.push({
          pathname: '/(tabs)/chat' as any,
          params: {
            conversationId: item.id,
            propertyTitle: item.property?.title || 'Property',
            otherPersonName: name,
          },
        })}
      >
        <View style={[
          styles.avatarCircle,
          userRole === 'landlord' && styles.tenantAvatar,
        ]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.conversationInfo}>
          <Text style={styles.personName}>{name}</Text>
          <Text style={styles.propertyName} numberOfLines={1}>
            🏠 {item.property?.title || 'Property'}
          </Text>
          <Text style={styles.cityName}>📍 {item.property?.city || ''}</Text>
        </View>

        <View style={styles.arrowContainer}>
          <Text style={styles.chatIcon}>💬</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.tealDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💬 Messages</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.subtitleRow}>
        <Text style={styles.subtitle}>
          {userRole === 'tenant'
            ? 'Your chats with landlords'
            : 'Chats from tenants'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversation}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>No messages yet</Text>
              <Text style={styles.emptySubtitle}>
                {userRole === 'tenant'
                  ? 'Browse properties and tap "Chat with Landlord" to start!'
                  : 'Tenants will appear here when they message you about your properties'}
              </Text>
              {userRole === 'tenant' && (
                <TouchableOpacity
                  style={styles.browseBtn}
                  onPress={() => router.replace('/(tabs)' as any)}
                >
                  <Text style={styles.browseBtnText}>Browse Properties</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.tealDark, paddingHorizontal: 16, paddingVertical: 16,
  },
  backText: { fontSize: 15, color: COLORS.white, fontWeight: '600', width: 60 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  subtitleRow: {
    backgroundColor: COLORS.teal,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  list: { padding: 16, flexGrow: 1 },
  conversationCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.teal,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  tenantAvatar: { backgroundColor: COLORS.coral },
  avatarText: { color: COLORS.white, fontWeight: '700', fontSize: 20 },
  conversationInfo: { flex: 1 },
  personName: { fontSize: 16, fontWeight: '700', color: COLORS.tealDark, marginBottom: 3 },
  propertyName: { fontSize: 13, color: COLORS.textMedium, marginBottom: 2 },
  cityName: { fontSize: 12, color: COLORS.textLight },
  arrowContainer: { alignItems: 'center' },
  chatIcon: { fontSize: 16, marginBottom: 2 },
  arrow: { fontSize: 20, color: COLORS.textLight, fontWeight: '600' },
  emptyState: {
    flex: 1, alignItems: 'center',
    paddingTop: 80, paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.tealDark, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14, color: COLORS.textMedium,
    textAlign: 'center', marginBottom: 24, lineHeight: 22,
  },
  browseBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32,
  },
  browseBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});