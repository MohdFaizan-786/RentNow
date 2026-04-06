import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, ScrollView, Image,
  Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
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
  error: '#D9534F',
  chipBg: '#E4DED3',
};

export default function AddPropertyStep2() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title: string; price: string; propertyType: string;
    rooms: string; address: string; city: string;
    state: string; pincode: string; description: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState('');
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [photos, setPhotos] = useState<{ type: string; uri: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  const photoTypes = [
    { key: 'bathroom', label: '🚿 Bathroom' },
    { key: 'kitchen', label: '🍳 Kitchen' },
    { key: 'room', label: '🛏 Room Area' },
    { key: 'extra', label: '📷 Extra' },
  ];

  const openCamera = async (type: string) => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission required', 'Camera permission is needed to take photos.');
        return;
      }
    }
    setCurrentPhotoType(type);
    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setShowCamera(false);
      if (currentPhotoType === 'cover') {
        setCoverPhoto(photo.uri);
      } else {
        setPhotos(prev => {
          const filtered = prev.filter(p => p.type !== currentPhotoType);
          return [...filtered, { type: currentPhotoType, uri: photo.uri }];
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadPhoto = async (uri: string, path: string): Promise<string> => {
    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${path}.${fileExt}`;
      const contentType = `image/${fileExt}`;

      // ✅ Read file as base64 then decode to ArrayBuffer
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64' as any,
      });

      const { error } = await supabase.storage
        .from('property-images')
        .upload(filePath, decode(base64), {
          contentType,
          upsert: true,
        });

      if (error) throw error;

      const { data } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      throw new Error(`Photo upload failed: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!coverPhoto) {
      Alert.alert('📸 Cover Photo Required', 'Please take a cover photo of the property exterior.');
      return;
    }

    // ✅ Check all 4 interior photos are taken
    const missingPhotos = photoTypes.filter(
      (photoType) => !photos.find(p => p.type === photoType.key)
    );

    if (missingPhotos.length > 0) {
      Alert.alert(
        '📸 Photos Required',
        `Please take all required photos. Missing:\n\n${missingPhotos.map(p => p.label).join('\n')}`,
      );
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not logged in');

      const timestamp = Date.now();

      // Upload cover photo
      const coverUrl = await uploadPhoto(
        coverPhoto,
        `${session.user.id}/${timestamp}/cover`
      );

      // Upload interior photos
      const photoUrls: string[] = [];
      for (const photo of photos) {
        const url = await uploadPhoto(
          photo.uri,
          `${session.user.id}/${timestamp}/${photo.type}`
        );
        photoUrls.push(url);
      }

      // Save to database
      const { error } = await supabase.from('properties').insert({
        landlord_id: session.user.id,
        title: params.title,
        price: Number(params.price),
        property_type: params.propertyType,
        rooms: Number(params.rooms),
        address: params.address,
        city: params.city,
        state: params.state,
        pincode: params.pincode,
        description: params.description,
        cover_photo: coverUrl,
        photos: photoUrls,
      });

      if (error) throw error;

      Alert.alert(
        '✅ Property Listed!',
        'Your property has been listed successfully.',
        [{ text: 'Go to Dashboard', onPress: () => router.replace('/(tabs)/landlord-dashboard' as any) }]
      );
    } catch (error: any) {
      Alert.alert('❌ Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // Camera View
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.cameraOverlay}>
            <Text style={styles.cameraLabel}>
              {currentPhotoType === 'cover'
                ? '📸 Click outside photo of entire property'
                : `📸 Click photo of ${currentPhotoType}`}
            </Text>
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cancelCameraBtn}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cancelCameraBtnText}>✕ Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              <View style={{ width: 80 }} />
            </View>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.stepDone}><Text style={styles.stepDoneText}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={styles.stepActive}><Text style={styles.stepActiveText}>2</Text></View>
        </View>

        <Text style={styles.heading}>Property Photos</Text>
        <Text style={styles.subheading}>Step 2 of 2 — Take photos using your camera</Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📷 All photos must be clicked using the app camera only. Max 5 photos including cover photo.
          </Text>
        </View>

        {/* Cover Photo */}
        <Text style={styles.sectionTitle}>Cover Photo (Required)</Text>
        <Text style={styles.sectionSubtitle}>Click a photo of the entire house/room from outside</Text>
        <TouchableOpacity
          style={[styles.photoBox, coverPhoto ? styles.photoBoxFilled : null]}
          onPress={() => openCamera('cover')}
        >
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto }} style={styles.photoPreview} resizeMode="cover" />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoPlaceholderIcon}>🏠</Text>
              <Text style={styles.photoPlaceholderText}>Tap to click Cover Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {coverPhoto && (
          <TouchableOpacity onPress={() => openCamera('cover')} style={styles.retakeBtn}>
            <Text style={styles.retakeBtnText}>🔄 Retake Cover Photo</Text>
          </TouchableOpacity>
        )}

        {/* Interior Photos */}
        <Text style={styles.sectionTitle}>Interior Photos (Max 4)</Text>
        <Text style={styles.sectionSubtitle}>Click photos of bathroom, kitchen, room etc.</Text>

        <View style={styles.interiorGrid}>
          {photoTypes.map((photoType) => {
            const existing = photos.find(p => p.type === photoType.key);
            return (
              <TouchableOpacity
                key={photoType.key}
                style={styles.interiorBox}
                onPress={() => openCamera(photoType.key)}
              >
                {existing ? (
                  <Image source={{ uri: existing.uri }} style={styles.interiorPreview} resizeMode="cover" />
                ) : (
                  <View style={styles.interiorPlaceholder}>
                    <Text style={styles.interiorPlaceholderIcon}>📷</Text>
                    <Text style={styles.interiorPlaceholderText}>{photoType.label}</Text>
                  </View>
                )}
                {existing && (
                  <View style={styles.interiorDoneTag}>
                    <Text style={styles.interiorDoneTagText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Photo Count */}
        <Text style={styles.photoCount}>
          Photos taken: {(coverPhoto ? 1 : 0) + photos.length} / 5
        </Text>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (loading || !coverPhoto || photos.length < 4) && styles.btnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.submitBtnText}>
              {!coverPhoto || photos.length < 4
                ? `📸 ${5 - (coverPhoto ? 1 : 0) - photos.length} Photos Remaining`
                : '🏠 List Property'}
            </Text>
          }
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
  stepDone: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#4CAF50',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDoneText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.border, marginHorizontal: 8 },
  stepLineDone: { backgroundColor: '#4CAF50' },
  heading: { fontSize: 26, fontWeight: '700', color: COLORS.tealDark, marginBottom: 6 },
  subheading: { fontSize: 14, color: COLORS.textMedium, marginBottom: 24 },
  infoBox: {
    backgroundColor: '#E8F4F3', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.teal, marginBottom: 24,
  },
  infoText: { fontSize: 13, color: COLORS.teal, lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.tealDark, marginBottom: 4 },
  sectionSubtitle: { fontSize: 13, color: COLORS.textMedium, marginBottom: 12 },
  photoBox: {
    width: '100%', height: 200, borderRadius: 12, borderWidth: 2,
    borderColor: COLORS.border, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 8,
  },
  photoBoxFilled: { borderStyle: 'solid', borderColor: COLORS.teal },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F2ED',
  },
  photoPlaceholderIcon: { fontSize: 40, marginBottom: 8 },
  photoPlaceholderText: { fontSize: 14, color: COLORS.textMedium, fontWeight: '500' },
  retakeBtn: {
    alignSelf: 'center', marginBottom: 20, paddingVertical: 8,
    paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.chipBg,
  },
  retakeBtnText: { fontSize: 13, color: COLORS.teal, fontWeight: '600' },
  interiorGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'space-between', marginBottom: 8,
  },
  interiorBox: {
    width: '48%', height: 130, borderRadius: 12, borderWidth: 2,
    borderColor: COLORS.border, borderStyle: 'dashed',
    overflow: 'hidden', marginBottom: 12,
  },
  interiorPreview: { width: '100%', height: '100%' },
  interiorPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F2ED',
  },
  interiorPlaceholderIcon: { fontSize: 28, marginBottom: 6 },
  interiorPlaceholderText: { fontSize: 12, color: COLORS.textMedium, fontWeight: '500', textAlign: 'center' },
  interiorDoneTag: {
    position: 'absolute', top: 8, right: 8, width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center',
  },
  interiorDoneTagText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  photoCount: {
    fontSize: 13, color: COLORS.textMedium, textAlign: 'center', marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: COLORS.teal, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1, backgroundColor: 'transparent',
    justifyContent: 'space-between', padding: 20,
  },
  cameraLabel: {
    color: COLORS.white, fontSize: 16, fontWeight: '700',
    textAlign: 'center', marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8,
  },
  cameraControls: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 30,
  },
  cancelCameraBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16,
    paddingVertical: 10, borderRadius: 8, width: 80, alignItems: 'center',
  },
  cancelCameraBtnText: { color: COLORS.white, fontWeight: '600' },
  captureBtn: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.white,
  },
  captureInner: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.white,
  },
});