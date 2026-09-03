import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text, AppButton } from 'react-native-basic-elements';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { moderateScale } from '../Constants/PixelRatio';

const FilterSheet = ({ visible, onClose, onApply, initialFilters }) => {
  const [selectedScore, setSelectedScore] = useState(initialFilters?.selectedScore || '50–75');
  const [selectedProductType, setSelectedProductType] = useState(initialFilters?.selectedProductType || 'Packaged food');
  const [company, setCompany] = useState(initialFilters?.company || 'Sunrise Foods Pvt Ltd');
  const [selectedFault, setSelectedFault] = useState(initialFilters?.selectedFault || 'Mfg. date');
  const [periodType, setPeriodType] = useState(initialFilters?.periodType || 'Monthly');
  const [selectedPeriod, setSelectedPeriod] = useState(initialFilters?.selectedPeriod || 'August 2026');
  const [selectedDate, setSelectedDate] = useState(initialFilters?.selectedDate || '');

  // Keep state synchronized with parent props whenever sheet opens or initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setSelectedScore(initialFilters.selectedScore || '50–75');
      setSelectedProductType(initialFilters.selectedProductType || 'Packaged food');
      setCompany(initialFilters.company || 'Sunrise Foods Pvt Ltd');
      setSelectedFault(initialFilters.selectedFault || 'Mfg. date');
      setPeriodType(initialFilters.periodType || 'Monthly');
      setSelectedPeriod(initialFilters.selectedPeriod || 'August 2026');
      setSelectedDate(initialFilters.selectedDate || '');
    }
  }, [initialFilters, visible]);

  const handleApply = () => {
    onApply({
      selectedScore,
      selectedProductType,
      company,
      selectedFault,
      periodType,
      selectedPeriod,
      selectedDate,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter history</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={moderateScale(22)} color="#0F172A" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Specific Date Search */}
            <Text style={styles.sectionLabel}>SEARCH BY SPECIFIC DATE</Text>
            <View style={styles.dateInputContainer}>
              <Icon name="calendar-month" size={moderateScale(20)} color="#64748B" style={styles.dateIcon} />
              <TextInput
                style={styles.dateTextInput}
                placeholder="YYYY-MM-DD or DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
                value={selectedDate}
                onChangeText={setSelectedDate}
              />
              {selectedDate ? (
                <TouchableOpacity onPress={() => setSelectedDate('')}>
                  <Icon name="close-circle" size={moderateScale(18)} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Compliance Score */}
            <Text style={styles.sectionLabel}>COMPLIANCE SCORE</Text>
            <View style={styles.row}>
              {['< 50', '50–75', '75–100'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, selectedScore === item && styles.chipActive]}
                  onPress={() => setSelectedScore(item)}
                >
                  <Text style={[styles.chipText, selectedScore === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Product Type */}
            <Text style={styles.sectionLabel}>PRODUCT TYPE</Text>
            <View style={styles.grid2}>
              {['Packaged food', 'Cosmetics', 'Beverages', 'Household'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chipGrid, selectedProductType === item && styles.chipActive]}
                  onPress={() => setSelectedProductType(item)}
                >
                  <Text style={[styles.chipText, selectedProductType === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Company */}
            <Text style={styles.sectionLabel}>COMPANY</Text>
            <View style={styles.dropdownInput}>
              <Text style={styles.inputText}>{company}</Text>
              <Icon name="chevron-down" size={moderateScale(20)} color="#64748B" />
            </View>

            {/* Fault Type */}
            <Text style={styles.sectionLabel}>FAULT TYPE</Text>
            <View style={styles.grid2}>
              {['MRP', 'Mfg. date', 'Font size', 'Origin'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chipGrid, selectedFault === item && styles.chipActive]}
                  onPress={() => setSelectedFault(item)}
                >
                  <Text style={[styles.chipText, selectedFault === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Period */}
            <Text style={styles.sectionLabel}>PERIOD</Text>
            <View style={styles.row}>
              {['Monthly', 'Yearly'].map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chipFlex, periodType === item && styles.chipActive]}
                  onPress={() => setPeriodType(item)}
                >
                  <Text style={[styles.chipText, periodType === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dropdownInput}>
              <Text style={styles.inputText}>{selectedPeriod}</Text>
              <Icon name="chevron-down" size={moderateScale(20)} color="#64748B" />
            </View>

            {/* Apply Button */}
            <AppButton
              title="Apply filters"
              style={styles.applyBtn}
              textStyle={styles.applyBtnText}
              onPress={handleApply}
            />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default FilterSheet;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
  sheetContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: moderateScale(24), borderTopRightRadius: moderateScale(24), maxHeight: '85%', paddingHorizontal: moderateScale(20), paddingTop: moderateScale(20), paddingBottom: moderateScale(30) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: moderateScale(16) },
  title: { fontSize: moderateScale(20), fontWeight: '700', color: '#0F172A' },
  scrollContent: { paddingBottom: moderateScale(20) },
  sectionLabel: { fontSize: moderateScale(11), fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginTop: moderateScale(16), marginBottom: moderateScale(10) },
  dateInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: moderateScale(8), height: moderateScale(44), paddingHorizontal: moderateScale(12), marginTop: moderateScale(4) },
  dateIcon: { marginRight: moderateScale(8) },
  dateTextInput: { flex: 1, fontSize: moderateScale(13), color: '#0F172A', paddingVertical: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: moderateScale(8) },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  chip: { flex: 1, height: moderateScale(42), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginHorizontal: moderateScale(3) },
  chipFlex: { flex: 1, height: moderateScale(42), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginHorizontal: moderateScale(4) },
  chipGrid: { width: '48%', height: moderateScale(42), borderRadius: moderateScale(8), borderWidth: 1, borderColor: '#CBD5E1', justifyContent: 'center', alignItems: 'center', marginBottom: moderateScale(8) },
  chipActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  chipText: { fontSize: moderateScale(13), color: '#334155', fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  dropdownInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: moderateScale(8), height: moderateScale(44), paddingHorizontal: moderateScale(12), marginTop: moderateScale(4) },
  inputText: { fontSize: moderateScale(13), color: '#334155' },
  applyBtn: { backgroundColor: '#0F172A', borderRadius: moderateScale(10), height: moderateScale(48), justifyContent: 'center', marginTop: moderateScale(24) },
  applyBtnText: { color: '#FFFFFF', fontSize: moderateScale(14), fontWeight: '700' },
});