import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Container, Text, AppButton } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import ImagePicker from 'react-native-image-crop-picker';

const ImageCapture = ({ navigation }) => {
  const [images, setImages] = useState({
    front: null,
    back: null,
    side: null,
    angle: null,
  });

  // Request Android Camera Permission
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera to capture product images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Launch Device Camera
  const captureImage = async (slotKey) => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Camera access is required to capture images.');
      return;
    }

    try {
      const image = await ImagePicker.openCamera({
        width: 1000,
        height: 1000,
        cropping: true,
        compressImageQuality: 0.8,
      });

      setImages((prev) => ({
        ...prev,
        [slotKey]: image.path,
      }));
    } catch (error) {
      if (error?.code !== 'E_PICKER_CANCELLED') {
        Alert.alert('Error', 'Failed to capture image.');
      }
    }
  };

  // Generic Camera Button Handler
  const handleOpenGeneralCamera = () => {
    if (!images.front) {
      captureImage('front');
    } else if (!images.back) {
      captureImage('back');
    } else if (!images.side) {
      captureImage('side');
    } else {
      captureImage('angle');
    }
  };

  const renderSlot = (slotKey, title) => {
    const uri = images[slotKey];

    if (uri) {
      return (
        <TouchableOpacity
          key={slotKey}
          activeOpacity={0.8}
          style={styles.capturedCard}
          onPress={() => captureImage(slotKey)}
        >
          <Image source={{ uri }} style={styles.imagePreview} />
          <View style={styles.overlayBadge}>
            <Text style={styles.overlayText}>{title} · Captured</Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={slotKey}
        activeOpacity={0.7}
        style={styles.dashedCard}
        onPress={() => captureImage(slotKey)}
      >
        <Image 
          source={require('../../Assets/camera.png')} 
          style={styles.slotIcon} 
          resizeMode="contain" 
        />
        <Text style={styles.dashedText}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <Text style={styles.subHeader}>SUNRISE WHEAT FLAKES</Text>
        <Text style={styles.title}>Capture package</Text>
        <Text style={styles.description}>Front, back and side panels required</Text>

        {/* 2x2 Image Grid */}
        <View style={styles.gridContainer}>
          {renderSlot('front', 'Front panel')}
          {renderSlot('back', 'Back panel')}
          {renderSlot('side', 'Side panel')}
          {renderSlot('angle', 'Additional angle')}
        </View>

        {/* Camera Action CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.cameraBtn}
          onPress={handleOpenGeneralCamera}
        >
          <Image 
            source={require('../../Assets/camera.png')} 
            style={styles.btnIcon} 
            resizeMode="contain" 
          />
          <Text style={styles.cameraBtnText}>Open camera</Text>
        </TouchableOpacity>

        {/* Submit CTA */}
        <AppButton
          title="Submit for inspection"
          textStyle={styles.submitBtnText}
          style={styles.submitBtn}
          onPress={() => {
            if (!images.front && !images.back) {
              Alert.alert('Image Required', 'Please capture at least the front and back panels.');
              return;
            }
            navigation.navigate('Processing', { capturedImages: images });
          }}
        />
      </ScrollView>
    </Container>
  );
};

export default ImageCapture;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: moderateScale(20), paddingTop: moderateScale(40), paddingBottom: moderateScale(20) },
  subHeader: { fontSize: moderateScale(11), fontWeight: '700', color: '#64748B', letterSpacing: 0.8 },
  title: { fontSize: moderateScale(24), fontWeight: '700', color: '#0F172A', marginTop: moderateScale(4) },
  description: { fontSize: moderateScale(13), color: '#64748B', marginBottom: moderateScale(24) },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: moderateScale(20) },
  capturedCard: {
    width: '48%',
    height: moderateScale(130),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    marginBottom: moderateScale(12),
    position: 'relative',
  },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  overlayBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: moderateScale(4),
    paddingHorizontal: moderateScale(6),
    alignItems: 'center',
  },
  overlayText: { color: '#FFFFFF', fontSize: moderateScale(10), fontWeight: '600' },
  dashedCard: {
    width: '48%',
    height: moderateScale(130),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  slotIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: '#64748B',
  },
  dashedText: { fontSize: moderateScale(12), color: '#64748B', marginTop: moderateScale(8) },
  cameraBtn: {
    backgroundColor: '#E6F4F1',
    borderRadius: moderateScale(12),
    height: moderateScale(50),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(12),
  },
  btnIcon: {
    width: moderateScale(20),
    height: moderateScale(20),
    tintColor: '#0D9488',
    marginRight: moderateScale(8),
  },
  cameraBtnText: { color: '#0D9488', fontSize: moderateScale(15), fontWeight: '600' },
  submitBtn: { backgroundColor: '#0F172A', borderRadius: moderateScale(12), height: moderateScale(52), justifyContent: 'center' },
  submitBtnText: { color: '#FFFFFF', fontSize: moderateScale(15), fontWeight: '600' },
});