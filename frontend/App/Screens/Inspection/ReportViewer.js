import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Container, Text } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';

const ReportViewer = ({ navigation }) => {
  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to result</Text>
        </TouchableOpacity>

        {/* Document Sheet */}
        <View style={styles.docCard}>
          <View style={styles.docHeader}>
            <View>
              <Text style={styles.docType}>LEGAL METROLOGY · REPORT</Text>
              <Text style={styles.docTitle}>Sunrise Wheat Flakes</Text>
              <Text style={styles.docMeta}>Case LM-A17F · Aug 28, 9:44 AM</Text>
            </View>
            <View style={styles.badgeReview}><Text style={styles.badgeTextReview}>REVIEW</Text></View>
          </View>

          <Text style={styles.sectionHeader}>PRODUCT DETAILS</Text>
          <View style={styles.dataRow}><Text style={styles.key}>Manufacturer</Text><Text style={styles.val}>Sunrise Foods Pvt Ltd</Text></View>
          <View style={styles.dataRow}><Text style={styles.key}>MRP</Text><Text style={styles.val}>₹85</Text></View>
          <View style={styles.dataRow}><Text style={styles.key}>Officer</Text><Text style={styles.val}>LM-2026-0417</Text></View>
          <View style={styles.dataRow}><Text style={styles.key}>Rule set</Text><Text style={styles.val}>v2026.07-r3</Text></View>

          <Text style={[styles.sectionHeader, { marginTop: moderateScale(16) }]}>IMAGE EVIDENCE</Text>
          <View style={styles.imageGrid}>
            <View style={styles.imgPlaceholder} />
            <View style={styles.imgPlaceholder} />
          </View>

          <Text style={[styles.sectionHeader, { marginTop: moderateScale(16) }]}>RULE-BY-RULE FINDINGS</Text>
          <View style={styles.findingRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.findingIcon, { tintColor: '#16A34A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.findingText}>MRP present & valid</Text>
          </View>
          <View style={styles.findingRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.findingIcon, { tintColor: '#16A34A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.findingText}>Net quantity valid</Text>
          </View>
          <View style={styles.findingRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.findingIcon, { tintColor: '#DC2626' }]} 
              resizeMode="contain" 
            />
            <Text style={[styles.findingText, { color: '#DC2626' }]}>Manufacture date missing</Text>
          </View>
          <View style={styles.findingRow}>
            <Image 
              source={require('../../Assets/verified.png')} 
              style={[styles.findingIcon, { tintColor: '#16A34A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.findingText}>Consumer care present</Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.downloadBtn}>
            <Image 
              source={require('../../Assets/download.png')} 
              style={[styles.actionIcon, { tintColor: '#0F172A' }]} 
              resizeMode="contain" 
            />
            <Text style={styles.btnLabel}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Image 
              source={require('../../Assets/share.png')} 
              style={[styles.actionIcon, { tintColor: '#FFFFFF' }]} 
              resizeMode="contain" 
            />
            <Text style={[styles.btnLabel, { color: '#FFFFFF' }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Container>
  );
};

export default ReportViewer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: moderateScale(20), paddingTop: moderateScale(40), paddingBottom: moderateScale(20) },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: moderateScale(16) },
  backText: { fontSize: moderateScale(14), fontWeight: '500', color: '#0F172A' },
  docCard: { backgroundColor: '#FFFFFF', borderRadius: moderateScale(12), padding: moderateScale(16), borderWidth: 1, borderColor: '#E2E8F0', marginBottom: moderateScale(20) },
  docHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#0F172A', paddingBottom: moderateScale(12), marginBottom: moderateScale(16) },
  docType: { fontSize: moderateScale(10), fontWeight: '700', color: '#64748B' },
  docTitle: { fontSize: moderateScale(16), fontWeight: '700', color: '#0F172A', marginTop: moderateScale(2) },
  docMeta: { fontSize: moderateScale(11), color: '#94A3B8', marginTop: moderateScale(2) },
  badgeReview: { backgroundColor: '#FEF3C7', paddingHorizontal: moderateScale(8), paddingVertical: moderateScale(4), borderRadius: moderateScale(12), height: moderateScale(22) },
  badgeTextReview: { color: '#D97706', fontSize: moderateScale(10), fontWeight: '700' },
  sectionHeader: { fontSize: moderateScale(10), fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, marginBottom: moderateScale(8) },
  dataRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: moderateScale(4) },
  key: { fontSize: moderateScale(12), color: '#64748B' },
  val: { fontSize: moderateScale(12), fontWeight: '600', color: '#0F172A' },
  imageGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  imgPlaceholder: { width: '48%', height: moderateScale(80), backgroundColor: '#F1F5F9', borderRadius: moderateScale(8) },
  findingRow: { flexDirection: 'row', alignItems: 'center', marginVertical: moderateScale(4) },
  findingIcon: { width: moderateScale(16), height: moderateScale(16) },
  findingText: { fontSize: moderateScale(12), color: '#334155', marginLeft: moderateScale(6) },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  downloadBtn: { flex: 0.48, height: moderateScale(48), borderRadius: moderateScale(10), borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  shareBtn: { flex: 0.48, height: moderateScale(48), borderRadius: moderateScale(10), backgroundColor: '#0F172A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  actionIcon: { width: moderateScale(18), height: moderateScale(18) },
  btnLabel: { marginLeft: moderateScale(6), fontSize: moderateScale(13), fontWeight: '600', color: '#0F172A' },
});