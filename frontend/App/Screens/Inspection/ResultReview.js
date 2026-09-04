import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';

const ResultReview = ({ navigation }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    setIsConfirmed(true);
  };

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Sunrise Wheat Flakes</Text>
            <Text style={styles.sub}>Case LM-A17F · 1 kg pack</Text>
          </View>
          <View style={styles.badgeReview}>
            <Text style={styles.badgeTextReview}>REVIEW</Text>
          </View>
        </View>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>Compliance score</Text>
          <Text style={styles.scoreValue}>72</Text>
        </View>

        {/* Extracted Fields */}
        <Text style={styles.sectionHeader}>EXTRACTED FIELDS</Text>
        <View style={styles.card}>
          <View style={styles.dataRow}>
            <Text style={styles.fieldKey}>MRP</Text>
            <Text style={styles.fieldVal}>₹85</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.fieldKey}>Net quantity</Text>
            <Text style={styles.fieldVal}>1 kg</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.fieldKey}>Manufacturer</Text>
            <Text style={styles.fieldVal}>Sunrise Foods Pvt Ltd</Text>
          </View>
          <View style={styles.dataRow}>
            <Text style={styles.fieldKey}>Mfg. date</Text>
            <Text style={[styles.fieldVal, { color: '#DC2626' }]}>Not detected</Text>
          </View>
        </View>

        {/* Rule Results */}
        <Text style={styles.sectionHeader}>RULE RESULTS</Text>
        <View style={styles.card}>
          <View style={styles.ruleRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.statusIcon, { tintColor: '#16A34A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.ruleText}>MRP declaration present and valid</Text>
          </View>
          <View style={styles.ruleRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.statusIcon, { tintColor: '#16A34A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.ruleText}>Net quantity format valid</Text>
          </View>
          <View style={styles.ruleRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.statusIcon, { tintColor: '#DC2626' }]} 
              resizeMode="contain" 
            />
            <Text style={[styles.ruleText, { color: '#DC2626' }]}>
              Manufacture date not found — needs manual check
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.overrideBtn}>
            <Text style={styles.overrideText}>Override</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmBtn, isConfirmed && styles.confirmBtnActive]} 
            onPress={handleConfirm}
          >
            <Text style={styles.confirmText}>
              {isConfirmed ? 'Confirmed' : 'Confirm'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* View Full Report Button */}
        <TouchableOpacity
          style={[styles.reportBtn, !isConfirmed && styles.disabledReportBtn]}
          disabled={!isConfirmed}
          onPress={() => navigation.navigate('ReportViewer')}
        >
          <Image
            source={require('../../Assets/eye.png')}
            style={[
              styles.btnIcon,
              { tintColor: isConfirmed ? '#0D9488' : '#94A3B8' }
            ]}
            resizeMode="contain"
          />
          <Text style={[styles.reportBtnText, !isConfirmed && styles.disabledReportBtnText]}>
            View full report
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </Container>
  );
};

export default ResultReview;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: {
    paddingHorizontal: moderateScale(20),
    paddingTop: moderateScale(40),
    paddingBottom: moderateScale(20),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: moderateScale(16),
  },
  title: { fontSize: moderateScale(20), fontWeight: '700', color: '#0F172A' },
  sub: { fontSize: moderateScale(12), color: '#64748B', marginTop: moderateScale(2) },
  badgeReview: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateScale(4),
    borderRadius: moderateScale(12),
  },
  badgeTextReview: { color: '#D97706', fontSize: moderateScale(10), fontWeight: '700' },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: moderateScale(20),
  },
  scoreLabel: { fontSize: moderateScale(13), color: '#64748B' },
  scoreValue: { fontSize: moderateScale(24), fontWeight: '700', color: '#0F172A' },
  sectionHeader: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: moderateScale(8),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: moderateScale(20),
  },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: moderateScale(6) },
  fieldKey: { fontSize: moderateScale(13), color: '#64748B' },
  fieldVal: { fontSize: moderateScale(13), fontWeight: '600', color: '#0F172A' },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginVertical: moderateScale(6) },
  statusIcon: { width: moderateScale(16), height: moderateScale(16) },
  ruleText: { fontSize: moderateScale(12), color: '#334155', marginLeft: moderateScale(8), flex: 1 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: moderateScale(12) },
  overrideBtn: {
    flex: 0.48,
    height: moderateScale(48),
    borderRadius: moderateScale(10),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  overrideText: { fontSize: moderateScale(14), fontWeight: '600', color: '#0F172A' },
  confirmBtn: {
    flex: 0.48,
    height: moderateScale(48),
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  confirmBtnActive: {
    backgroundColor: '#059669',
  },
  confirmText: { fontSize: moderateScale(14), fontWeight: '600', color: '#FFFFFF' },
  reportBtn: {
    height: moderateScale(48),
    borderRadius: moderateScale(10),
    backgroundColor: '#E6F4F1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    width: moderateScale(18),
    height: moderateScale(18),
    marginRight: moderateScale(6),
  },
  reportBtnText: { color: '#0D9488', fontSize: moderateScale(14), fontWeight: '600' },
  disabledReportBtn: {
    backgroundColor: '#F1F5F9',
    opacity: 0.7,
  },
  disabledReportBtnText: {
    color: '#94A3B8',
  },
});