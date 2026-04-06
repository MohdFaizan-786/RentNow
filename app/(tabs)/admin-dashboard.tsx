import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ScrollView, FlatList,
    ActivityIndicator, Alert, Modal, TextInput, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';

const COLORS = {
    background: '#1A2A2A',
    teal: '#2A5C59',
    tealDark: '#1E4442',
    tealLight: '#3A7C79',
    white: '#FFFFFF',
    textDark: '#1A2A2A',
    textMedium: '#444444',
    textLight: '#888888',
    border: '#2A4444',
    error: '#D9534F',
    gold: '#C4952A',
    coral: '#E06449',
    cardBg: '#243333',
    success: '#4CAF50',
};

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tenants' | 'landlords' | 'properties'>('tenants');
    const [tenants, setTenants] = useState<any[]>([]);
    const [landlords, setLandlords] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchText, setSearchText] = useState('');

    useFocusEffect(
        useCallback(() => {
            verifyAdminAndFetch();
        }, [])
    );

    const verifyAdminAndFetch = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.replace('/(tabs)/admin-login' as any); return; }

            const { data: admin } = await supabase
                .from('admins')
                .select('id')
                .eq('id', session.user.id)
                .single();

            if (!admin) { router.replace('/(tabs)' as any); return; }

            await fetchAllData();
        } catch (error) {
            Alert.alert('Error', 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        const [tenantsRes, landlordsRes, propertiesRes] = await Promise.all([
            supabase.from('tenants').select('*').order('created_at', { ascending: false }),
            supabase.from('landlords').select('*').order('created_at', { ascending: false }),
            supabase.from('properties').select('*').order('created_at', { ascending: false }),
        ]);
        setTenants(tenantsRes.data || []);
        setLandlords(landlordsRes.data || []);
        setProperties(propertiesRes.data || []);
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out', style: 'destructive',
                onPress: async () => {
                    await supabase.auth.signOut();
                    router.replace('/(tabs)' as any);
                },
            },
        ]);
    };

    const handleDeleteUser = (user: any, type: 'tenant' | 'landlord') => {
        Alert.alert(
            '🗑 Delete User',
            `Are you sure you want to permanently delete ${user.first_name} ${user.last_name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        try {
                            const table = type === 'tenant' ? 'tenants' : 'landlords';
                            await supabase.from(table).delete().eq('id', user.id);

                            // Delete from auth
                            await supabase.rpc('delete_user', { user_id: user.id });

                            setShowDetailModal(false);
                            await fetchAllData();
                            Alert.alert('✅ Deleted', 'User has been removed successfully.');
                        } catch (error: any) {
                            // Even if auth delete fails, table delete succeeded
                            setShowDetailModal(false);
                            await fetchAllData();
                            Alert.alert('✅ Deleted', 'User has been removed from records.');
                        }
                    },
                },
            ]
        );
    };

    const handleDeleteProperty = (property: any) => {
        Alert.alert(
            '🗑 Delete Property',
            `Are you sure you want to delete "${property.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive',
                    onPress: async () => {
                        await supabase.from('properties').delete().eq('id', property.id);
                        setShowDetailModal(false);
                        await fetchAllData();
                        Alert.alert('✅ Deleted', 'Property has been removed successfully.');
                    },
                },
            ]
        );
    };

    const filteredTenants = tenants.filter(t =>
        `${t.first_name} ${t.last_name} ${t.email} ${t.city}`
            .toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredLandlords = landlords.filter(l =>
        `${l.first_name} ${l.last_name} ${l.email} ${l.city}`
            .toLowerCase().includes(searchText.toLowerCase())
    );

    const filteredProperties = properties.filter(p =>
        `${p.title} ${p.city} ${p.state}`
            .toLowerCase().includes(searchText.toLowerCase())
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator size="large" color={COLORS.teal} style={{ marginTop: 100 }} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>⚙️ Admin Dashboard</Text>
                    <Text style={styles.headerSubtitle}>Rent Now Management Panel</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{tenants.length}</Text>
                    <Text style={styles.statLabel}>Tenants</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{landlords.length}</Text>
                    <Text style={styles.statLabel}>Landlords</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{properties.length}</Text>
                    <Text style={styles.statLabel}>Properties</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{tenants.length + landlords.length}</Text>
                    <Text style={styles.statLabel}>Total Users</Text>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, email, city..."
                    placeholderTextColor={COLORS.textLight}
                    value={searchText}
                    onChangeText={setSearchText}
                />
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
                {(['tenants', 'landlords', 'properties'] as const).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                            {tab === 'tenants' ? `🏠 Tenants (${filteredTenants.length})`
                                : tab === 'landlords' ? `🏢 Landlords (${filteredLandlords.length})`
                                    : `🏗 Properties (${filteredProperties.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

                {/* Tenants Tab */}
                {activeTab === 'tenants' && (
                    filteredTenants.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No tenants found</Text>
                        </View>
                    ) : (
                        filteredTenants.map((tenant) => (
                            <TouchableOpacity
                                key={tenant.id}
                                style={styles.userCard}
                                onPress={() => { setSelectedUser({ ...tenant, type: 'tenant' }); setShowDetailModal(true); }}
                            >
                                <View style={styles.userAvatar}>
                                    <Text style={styles.userAvatarText}>
                                        {tenant.first_name?.charAt(0)}{tenant.last_name?.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{tenant.first_name} {tenant.last_name}</Text>
                                    <Text style={styles.userEmail}>{tenant.email}</Text>
                                    <Text style={styles.userLocation}>📍 {tenant.city}, {tenant.state}</Text>
                                </View>
                                <View style={styles.userBadge}>
                                    <Text style={styles.userBadgeText}>🏠 Tenant</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )
                )}

                {/* Landlords Tab */}
                {activeTab === 'landlords' && (
                    filteredLandlords.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No landlords found</Text>
                        </View>
                    ) : (
                        filteredLandlords.map((landlord) => (
                            <TouchableOpacity
                                key={landlord.id}
                                style={styles.userCard}
                                onPress={() => { setSelectedUser({ ...landlord, type: 'landlord' }); setShowDetailModal(true); }}
                            >
                                <View style={[styles.userAvatar, styles.landlordAvatar]}>
                                    <Text style={styles.userAvatarText}>
                                        {landlord.first_name?.charAt(0)}{landlord.last_name?.charAt(0)}
                                    </Text>
                                </View>
                                <View style={styles.userInfo}>
                                    <Text style={styles.userName}>{landlord.first_name} {landlord.last_name}</Text>
                                    <Text style={styles.userEmail}>{landlord.email}</Text>
                                    <Text style={styles.userLocation}>📍 {landlord.city}, {landlord.state}</Text>
                                </View>
                                <View style={[styles.userBadge, styles.landlordBadge]}>
                                    <Text style={styles.userBadgeText}>🏢 Landlord</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )
                )}

                {/* Properties Tab */}
                {activeTab === 'properties' && (
                    filteredProperties.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No properties found</Text>
                        </View>
                    ) : (
                        filteredProperties.map((property) => (
                            <TouchableOpacity
                                key={property.id}
                                style={styles.propertyCard}
                                onPress={() => { setSelectedUser({ ...property, type: 'property' }); setShowDetailModal(true); }}
                            >
                                <View style={styles.propertyInfo}>
                                    <Text style={styles.propertyTitle}>{property.title}</Text>
                                    <Text style={styles.propertyPrice}>₹{property.price}/month</Text>
                                    <Text style={styles.propertyLocation}>📍 {property.city}, {property.state}</Text>
                                    <Text style={styles.propertyMeta}>🏠 {property.property_type} • 🛏 {property.rooms} Room(s)</Text>
                                </View>
                                <View style={styles.propertyDeleteBtn}>
                                    <Text style={styles.propertyDeleteBtnText}>View</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )
                )}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Detail Modal */}
            <Modal
                visible={showDetailModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowDetailModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedUser?.type === 'property' ? '🏠 Property Details'
                                    : selectedUser?.type === 'landlord' ? '🏢 Landlord Details'
                                        : '🏠 Tenant Details'}
                            </Text>
                            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

                            {/* User Details */}
                            {selectedUser?.type !== 'property' && (
                                <View style={styles.detailSection}>
                                    <View style={styles.detailAvatarRow}>
                                        <View style={[
                                            styles.detailAvatar,
                                            selectedUser?.type === 'landlord' && styles.landlordAvatar,
                                        ]}>
                                            <Text style={styles.detailAvatarText}>
                                                {selectedUser?.first_name?.charAt(0)}{selectedUser?.last_name?.charAt(0)}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={styles.detailName}>
                                                {selectedUser?.first_name} {selectedUser?.last_name}
                                            </Text>
                                            <Text style={styles.detailRole}>
                                                {selectedUser?.type === 'landlord' ? '🏢 Landlord' : '🏠 Tenant'}
                                            </Text>
                                        </View>
                                    </View>

                                    {[
                                        { label: '📧 Email', value: selectedUser?.email },
                                        { label: '📱 Mobile', value: selectedUser?.mobile_no },
                                        { label: '📍 Address', value: selectedUser?.address },
                                        { label: '🏙 City', value: selectedUser?.city },
                                        { label: '🗺 State', value: selectedUser?.state },
                                        { label: '📮 Pincode', value: selectedUser?.pincode },
                                        { label: '🪪 Aadhaar', value: `XXXX XXXX ${selectedUser?.aadhaar_no?.slice(-4)}` },
                                        { label: '📅 Joined', value: new Date(selectedUser?.created_at).toLocaleDateString('en-IN') },
                                    ].map((item, index) => (
                                        <View key={index} style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{item.label}</Text>
                                            <Text style={styles.detailValue}>{item.value}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Property Details */}
                            {selectedUser?.type === 'property' && (
                                <View style={styles.detailSection}>
                                    {[
                                        { label: '🏠 Title', value: selectedUser?.title },
                                        { label: '💰 Price', value: `₹${selectedUser?.price}/month` },
                                        { label: '👥 Type', value: selectedUser?.property_type },
                                        { label: '🛏 Rooms', value: `${selectedUser?.rooms} Room(s)` },
                                        { label: '📍 Address', value: selectedUser?.address },
                                        { label: '🏙 City', value: selectedUser?.city },
                                        { label: '🗺 State', value: selectedUser?.state },
                                        { label: '📮 Pincode', value: selectedUser?.pincode },
                                        { label: '📋 Description', value: selectedUser?.description || 'N/A' },
                                        { label: '📅 Listed On', value: new Date(selectedUser?.created_at).toLocaleDateString('en-IN') },
                                    ].map((item, index) => (
                                        <View key={index} style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>{item.label}</Text>
                                            <Text style={styles.detailValue}>{item.value}</Text>
                                        </View>
                                    ))}

                                    {/* ✅ Cover Photo */}
                                    {selectedUser?.cover_photo && (
                                        <View style={styles.photoSection}>
                                            <Text style={styles.photoSectionTitle}>🏠 Cover Photo</Text>
                                            <Image
                                                source={{ uri: selectedUser.cover_photo }}
                                                style={styles.coverPhotoAdmin}
                                                resizeMode="cover"
                                            />
                                        </View>
                                    )}

                                    {/* ✅ Interior Photos */}
                                    {selectedUser?.photos?.length > 0 && (
                                        <View style={styles.photoSection}>
                                            <Text style={styles.photoSectionTitle}>📷 Interior Photos ({selectedUser.photos.length})</Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                                {selectedUser.photos.map((photo: string, index: number) => (
                                                    <Image
                                                        key={index}
                                                        source={{ uri: photo }}
                                                        style={styles.interiorPhotoAdmin}
                                                        resizeMode="cover"
                                                    />
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}

                                </View>
                            )}

                            {/* Action Buttons */}
                            <TouchableOpacity
                                style={styles.deleteBtn}
                                onPress={() => {
                                    if (selectedUser?.type === 'property') {
                                        handleDeleteProperty(selectedUser);
                                    } else {
                                        handleDeleteUser(selectedUser, selectedUser?.type);
                                    }
                                }}
                            >
                                <Text style={styles.deleteBtnText}>
                                    🗑 Delete {selectedUser?.type === 'property' ? 'Property' : 'User'}
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.closeBtn}
                                onPress={() => setShowDetailModal(false)}
                            >
                                <Text style={styles.closeBtnText}>Close</Text>
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.tealDark,
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12,
        paddingVertical: 6, borderRadius: 8,
    },
    logoutText: { color: COLORS.white, fontWeight: '600', fontSize: 12 },
    statsRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingHorizontal: 12, paddingVertical: 12,
        backgroundColor: COLORS.tealDark,
    },
    statCard: {
        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
        padding: 10, alignItems: 'center', flex: 1, marginHorizontal: 3,
    },
    statNumber: { fontSize: 22, fontWeight: '700', color: COLORS.gold },
    statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    searchRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: COLORS.tealDark },
    searchInput: {
        backgroundColor: '#243333', borderRadius: 10, borderWidth: 1,
        borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 10,
        fontSize: 14, color: COLORS.white,
    },
    tabRow: { flexDirection: 'row', backgroundColor: COLORS.tealDark, paddingBottom: 8, paddingHorizontal: 12 },
    tab: {
        flex: 1, paddingVertical: 8, alignItems: 'center',
        borderRadius: 8, marginHorizontal: 3,
    },
    tabActive: { backgroundColor: COLORS.teal },
    tabText: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    tabTextActive: { color: COLORS.white },
    content: { flex: 1, paddingTop: 12 },
    emptyState: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { color: COLORS.textLight, fontSize: 16 },

    // User Card
    userCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.cardBg, marginHorizontal: 12,
        marginBottom: 8, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#2A4444',
    },
    userAvatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.teal, justifyContent: 'center',
        alignItems: 'center', marginRight: 12,
    },
    landlordAvatar: { backgroundColor: COLORS.coral },
    userAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
    userEmail: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
    userLocation: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    userBadge: {
        backgroundColor: 'rgba(42,92,89,0.4)', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 4,
    },
    landlordBadge: { backgroundColor: 'rgba(224,100,73,0.3)' },
    userBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '600' },

    // Property Card
    propertyCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.cardBg, marginHorizontal: 12,
        marginBottom: 8, borderRadius: 12, padding: 14,
        borderWidth: 1, borderColor: '#2A4444',
    },
    propertyInfo: { flex: 1 },
    propertyTitle: { fontSize: 15, fontWeight: '700', color: COLORS.white, marginBottom: 2 },
    propertyPrice: { fontSize: 13, color: COLORS.gold, fontWeight: '600', marginBottom: 2 },
    propertyLocation: { fontSize: 12, color: COLORS.textLight, marginBottom: 2 },
    propertyMeta: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    propertyDeleteBtn: {
        backgroundColor: COLORS.teal, borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 6,
    },
    propertyDeleteBtnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },

    // Modal
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#1E3333', borderTopLeftRadius: 20,
        borderTopRightRadius: 20, padding: 24, maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    modalClose: { fontSize: 18, color: COLORS.textLight, fontWeight: '600' },
    detailSection: {},
    detailAvatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    detailAvatar: {
        width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.teal,
        justifyContent: 'center', alignItems: 'center', marginRight: 14,
    },
    detailAvatarText: { color: COLORS.white, fontWeight: '700', fontSize: 20 },
    detailName: { fontSize: 18, fontWeight: '700', color: COLORS.white },
    detailRole: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2A4444',
    },
    detailLabel: { fontSize: 13, color: COLORS.textLight, flex: 1 },
    detailValue: { fontSize: 13, color: COLORS.white, fontWeight: '500', flex: 2, textAlign: 'right' },
    deleteBtn: {
        backgroundColor: COLORS.error, borderRadius: 12,
        paddingVertical: 14, alignItems: 'center', marginTop: 20, marginBottom: 10,
    },
    deleteBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
    closeBtn: {
        backgroundColor: '#2A4444', borderRadius: 12,
        paddingVertical: 14, alignItems: 'center', marginBottom: 10,
    },
    closeBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 15 },

    photoSection: { marginTop: 16 },
    photoSectionTitle: {
        fontSize: 14, fontWeight: '700', color: COLORS.white, marginBottom: 10,
    },
    coverPhotoAdmin: {
        width: '100%', height: 200, borderRadius: 12, marginBottom: 8,
    },
    interiorPhotoAdmin: {
        width: 150, height: 120, borderRadius: 10,
        marginRight: 10, borderWidth: 1, borderColor: COLORS.border,
    },
});