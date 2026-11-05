import React, { useEffect, useState } from 'react';

import {
  StyleSheet,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { Container, Text } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../../Constants/PixelRatio';

import HttpClient from '../../Utils/HttpClient';

const Processing = ({ navigation, route }) => {

  const { capturedImages } = route.params || {};

  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    processImages();
  }, []);

  const processImages = async () => {

    try {

      // ----------------------------------------------------
      // 1. CHECK FRONT IMAGE
      // ----------------------------------------------------

      if (!capturedImages?.front) {
        throw new Error('Front image is missing.');
      }

      console.log('====================================');
      console.log('STARTING PACKAGE PROCESSING');
      console.log('====================================');

      console.log('Front image:', capturedImages.front);

      setCurrentStep(1);


      // ----------------------------------------------------
// 2. PREPARE IMAGE
// ----------------------------------------------------

const keys = ['front', 'back', 'side', 'angle'];

const imageFiles = keys
  .filter((key) => capturedImages && capturedImages[key])
  .map((key) => ({
    path: capturedImages[key],
    mime: 'image/jpeg',
  }));

console.log('Image files prepared:', imageFiles);

setCurrentStep(2);


      // ----------------------------------------------------
      // 3. CALL NODE BACKEND
      // ----------------------------------------------------

      console.log('Calling evaluation API...');

      const result = await HttpClient.evaluatePackage(
        '/api/cases/evaluate',
        imageFiles
      );

      console.log('Evaluation API returned!');

      console.log(
        'Evaluation result:',
        JSON.stringify(result, null, 2)
      );


      // ----------------------------------------------------
      // 4. UPDATE PROCESSING STATUS
      // ----------------------------------------------------

      setCurrentStep(3);

      console.log('====================================');
      console.log('OCR + COMPLIANCE RESULT');
      console.log('====================================');

      console.log(
        JSON.stringify(result, null, 2)
      );


      // ----------------------------------------------------
      // 5. NAVIGATE TO RESULT REVIEW
      // ----------------------------------------------------

      // Pass result under the `apiData` key required by ResultReview.js
      navigation.navigate('ResultReview', {
        apiData: result,
        capturedImages: capturedImages,
      });

    } catch (err) {

      console.log('========================================');
      console.log('PROCESSING ERROR OBJECT:');
      console.log(err);

      console.log('PROCESSING ERROR JSON:');
      console.log(JSON.stringify(err, null, 2));

      console.log('PROCESSING ERROR MESSAGE:');
      console.log(err?.message);

      console.log('========================================');


      // ----------------------------------------------------
      // SAFELY CONVERT ERROR TO STRING
      // ----------------------------------------------------

      let message =
        'Unable to process the package image.';

      if (typeof err === 'string') {

        message = err;

      } else if (
        typeof err?.message === 'string'
      ) {

        message = err.message;

      } else if (
        typeof err?.error === 'string'
      ) {

        message = err.error;

      } else if (
        typeof err?.msg === 'string'
      ) {

        message = err.msg;

      } else if (
        typeof err?.response?.data?.detail === 'string'
      ) {

        message =
          err.response.data.detail;

      } else if (
        typeof err?.response?.data?.detail?.message ===
        'string'
      ) {

        message =
          err.response.data.detail.message;

      } else if (err?.response?.data) {

        message = JSON.stringify(
          err.response.data,
          null,
          2
        );

      } else if (err) {

        message = JSON.stringify(
          err,
          null,
          2
        );

      }

      setError(message);

      Alert.alert(
        'Processing Failed',
        message,
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };


  // ----------------------------------------------------
  // STATUS ICON
  // ----------------------------------------------------

  const getIcon = (step) => {

    if (currentStep > step) {

      return (
        <Icon
          name="check"
          size={moderateScale(18)}
          color="#16A34A"
        />
      );

    }

    if (currentStep === step) {

      return (
        <ActivityIndicator
          size="small"
          color="#0D9488"
        />
      );

    }

    return (
      <Icon
        name="circle-outline"
        size={moderateScale(16)}
        color="#64748B"
      />
    );
  };


  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (
    <Container style={styles.container}>

      <View style={styles.content}>

        {!error && (
          <ActivityIndicator
            size="large"
            color="#0D9488"
            style={styles.loader}
          />
        )}

        <Text style={styles.title}>
          {error
            ? 'Processing failed'
            : 'Reading declarations'}
        </Text>

        <Text style={styles.subtitle}>
          OCR & Legal Metrology evaluation
        </Text>


        <View style={styles.statusCard}>

          {/* STEP 1 */}

          <View style={styles.statusRow}>

            {getIcon(0)}

            <Text style={styles.statusText}>
              Images uploaded
            </Text>

          </View>


          {/* STEP 2 */}

          <View style={styles.statusRow}>

            {getIcon(1)}

            <Text style={styles.statusText}>
              Sending image to OCR
            </Text>

          </View>


          {/* STEP 3 */}

          <View style={styles.statusRow}>

            {getIcon(2)}

            <Text style={styles.statusText}>
              Extracting declarations
            </Text>

          </View>


          {/* STEP 4 */}

          <View style={styles.statusRow}>

            {getIcon(3)}

            <Text style={styles.statusText}>
              Checking Legal Metrology rules
            </Text>

          </View>

        </View>

      </View>

    </Container>
  );
};


export default Processing;


// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: moderateScale(20),
    alignItems: 'center',
  },

  loader: {
    marginBottom: moderateScale(20),
    transform: [
      {
        scale: 1.3,
      },
    ],
  },

  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginTop: moderateScale(4),
    marginBottom: moderateScale(28),
  },

  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: moderateScale(8),
  },

  statusText: {
    marginLeft: moderateScale(10),
    fontSize: moderateScale(13),
    color: '#334155',
    fontWeight: '500',
  },

});