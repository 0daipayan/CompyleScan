import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import { moderateScale } from '../../Constants/PixelRatio';

const Splash = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconBadge}>
          <Image
            source={require('../../Assets/logo.png')} // Verify filename and extension (.png, .jpg) match your Assets folder
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>ComplySpect</Text>
        <Text style={styles.subtitle}>AI-Powered Compliance Inspection</Text>
      </View>

      <Text style={styles.footerText}>
        Ministry of Consumer Affairs, Food & Public Distribution
      </Text>
    </View>
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center', // Fixed typo: was "justify"
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },
  content: {
    alignItems: 'center',
  },
  iconBadge: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(18),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: moderateScale(20),
    overflow: 'hidden',
  },
  logoImage: {
    width: moderateScale(48),
    height: moderateScale(48),
  },
  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: moderateScale(6),
  },
  subtitle: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  footerText: {
    position: 'absolute',
    bottom: moderateScale(40),
    fontSize: moderateScale(11),
    color: '#64748B',
    textAlign: 'center',
  },
});