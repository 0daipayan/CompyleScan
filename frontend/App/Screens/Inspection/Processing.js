import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Container, Text } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../../Constants/PixelRatio';

const Processing = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('ResultReview');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <Container style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#0D9488" style={styles.loader} />
        <Text style={styles.title}>Reading declarations</Text>
        <Text style={styles.subtitle}>Case LM-A17F · Sunrise Wheat Flakes</Text>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Icon name="check" size={moderateScale(18)} color="#16A34A" />
            <Text style={styles.statusTextDone}>Images uploaded</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="check" size={moderateScale(18)} color="#16A34A" />
            <Text style={styles.statusTextDone}>Image quality verified</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="check" size={moderateScale(18)} color="#16A34A" />
            <Text style={styles.statusTextDone}>Text extracted (OCR)</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="check" size={moderateScale(18)} color="#16A34A" />
            <Text style={styles.statusTextDone}>Fields parsed</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="circle-outline" size={moderateScale(16)} color="#64748B" />
            <Text style={styles.statusTextPending}>Checking Legal Metrology rules...</Text>
          </View>
          <View style={styles.statusRow}>
            <Icon name="circle-outline" size={moderateScale(16)} color="#64748B" />
            <Text style={styles.statusTextPending}>Compliance score</Text>
          </View>
        </View>
      </View>
    </Container>
  );
};

export default Processing;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center' },
  content: { paddingHorizontal: moderateScale(20), alignItems: 'center' },
  loader: { marginBottom: moderateScale(20), transform: [{ scale: 1.3 }] },
  title: { fontSize: moderateScale(20), fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: moderateScale(12), color: '#64748B', marginTop: moderateScale(4), marginBottom: moderateScale(28) },
  statusCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(12), padding: moderateScale(16), width: '100%', borderWidth: 1, borderColor: '#E2E8F0' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginVertical: moderateScale(8) },
  statusTextDone: { marginLeft: moderateScale(10), fontSize: moderateScale(13), color: '#334155', fontWeight: '500' },
  statusTextPending: { marginLeft: moderateScale(10), fontSize: moderateScale(13), color: '#64748B' },
});