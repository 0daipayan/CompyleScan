import React from 'react';
import { StyleSheet, View, Text, Dimensions, Image } from 'react-native';
import { moderateScale } from '../../Constants/PixelRatio';

const { width } = Dimensions.get('window');

const OnboardingSlide = ({ item }) => {
  return (
    <View style={styles.slide}>
      <View style={styles.imageCard}>
        <Image 
          source={item.image} 
          style={styles.slideImage} 
          resizeMode="contain" 
        />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
};

export default OnboardingSlide;

const styles = StyleSheet.create({
  slide: {
    width,
    alignItems: 'center',
    paddingHorizontal: moderateScale(28),
    paddingTop: moderateScale(20),
  },
  imageCard: {
    width: width - moderateScale(56),
    height: moderateScale(260),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(32),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  slideImage: {
    width: moderateScale(100),
    height: moderateScale(100),
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: moderateScale(12),
  },
  description: {
    fontSize: moderateScale(13),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(20),
  },
});