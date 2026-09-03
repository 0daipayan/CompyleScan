import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { Container } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';
import CustomButton from '../../Components/CustomButton';
import OnboardingSlide from './OnboardingSlide';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('../../Assets/scanner.png'),
    title: 'Scan any package in seconds',
    description: 'Capture front, back and side panels — the app reads every declaration automatically.',
  },
  {
    id: '2',
    image: require('../../Assets/verified.png'),
    title: 'Checked against Legal Metrology rules',
    description: 'Every declaration is validated against a versioned, auditable rule set — nothing is a black box.',
  },
  {
    id: '3',
    image: require('../../Assets/report.png'),
    title: 'Get an evidence-backed report',
    description: 'Every inspection produces a shareable PDF with images, findings and the rules applied.',
  },
];

const Onboarding = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.replace('SignIn');
    }
  };

  return (
    <Container style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('SignIn')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={({ item }) => <OnboardingSlide item={item} />}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <CustomButton
          title={currentIndex === SLIDES.length - 1 ? 'Get started' : 'Next'}
          onPress={handleNext}
        />
      </View>
    </Container>
  );
};

export default Onboarding;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: moderateScale(40),
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(10),
  },
  skipText: {
    color: '#64748B',
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: moderateScale(20),
    paddingBottom: moderateScale(24),
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: moderateScale(20),
  },
  dot: {
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    marginHorizontal: moderateScale(3),
  },
  activeDot: {
    width: moderateScale(20),
    backgroundColor: '#0F172A',
  },
  inactiveDot: {
    width: moderateScale(6),
    backgroundColor: '#CBD5E1',
  },
});