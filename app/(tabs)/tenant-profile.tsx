import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, StatusBar, ScrollView,
    ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
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
    chipBg: '#E4DED3',
    border: '#D5CFC4',
};

export default function TenantProfile() {
    const router = useRouter();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTenant();
    }, []);

    const fetchTenant = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.replace('/(tabs)' as any); return; }

            const { data } = await supabase
                .from('tenants')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setTenant(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/(tabs)' as any);
                    },
                },
            ]
        );
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
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>🚪 Logout</Text>
                    </TouchableOpacity>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {tenant?.first_name?.charAt(0)}{tenant?.last_name?.charAt(0)}
                        </Text>
                    </View>
                    <Text style={styles.profileName}>
                        {tenant?.first_name} {tenant?.last_name}
                    </Text>
                    <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>🏠 Tenant</Text>
                    </View>
                </View>

                {/* Details Card */}
                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📧 Email</Text>
                        <Text style={styles.detailValue}>{tenant?.email}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📱 Mobile</Text>
                        <Text style={styles.detailValue}>{tenant?.mobile_no}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📍 Address</Text>
                        <Text style={styles.detailValue}>{tenant?.address}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🏙 City</Text>
                        <Text style={styles.detailValue}>{tenant?.city}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🗺 State</Text>
                        <Text style={styles.detailValue}>{tenant?.state}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>📮 Pincode</Text>
                        <Text style={styles.detailValue}>{tenant?.pincode}</Text>
                    </View>
                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>🪪 Aadhaar</Text>
                        <Text style={styles.detailValue}>
                            XXXX XXXX {tenant?.aadhaar_no?.slice(-4)}
                        </Text>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBigBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBigBtnText}>🚪 Log Out</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    },
    backText: { fontSize: 15, color: COLORS.teal, fontWeight: '600' },
    logoutBtn: {
        backgroundColor: COLORS.chipBg, paddingHorizontal: 12,
        paddingVertical: 6, borderRadius: 8,
    },
    logoutText: { fontSize: 13, color: COLORS.coral, fontWeight: '600' },
    profileCard: {
        backgroundColor: COLORS.teal, marginHorizontal: 16,
        borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16,
    },
    avatarCircle: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    avatarText: { fontSize: 28, fontWeight: '700', color: COLORS.white },
    profileName: { fontSize: 22, fontWeight: '700', color: COLORS.white, marginBottom: 8 },
    roleBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 6,
    },
    roleBadgeText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },
    detailsCard: {
        backgroundColor: COLORS.white, marginHorizontal: 16,
        borderRadius: 16, padding: 20, marginBottom: 16,
        elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    },
    sectionTitle: {
        fontSize: 16, fontWeight: '700', color: COLORS.tealDark, marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 12,
    },
    detailLabel: { fontSize: 14, color: COLORS.textMedium, fontWeight: '600', flex: 1 },
    detailValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '500', flex: 2, textAlign: 'right' },
    divider: { height: 1, backgroundColor: COLORS.border },
    logoutBigBtn: {
        backgroundColor: COLORS.coral, marginHorizontal: 16,
        borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 30,
    },
    logoutBigBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});