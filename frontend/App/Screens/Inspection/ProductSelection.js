import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Container, Text, AppButton } from 'react-native-basic-elements';
import { moderateScale } from '../../Constants/PixelRatio';

const CATEGORIES = ['Packaged food', 'Cosmetics', 'Beverages', 'Household'];

const RECENT_PRODUCTS = [
  { id: '1', title: 'Sunrise Wheat Flakes', sub: '1 kg pack', status: 'PASS', badgeStyle: 'badgePass', textStyle: 'badgeTextPass' },
  { id: '2', title: 'Coastal Salt 500g', sub: 'Iodised', status: 'REVIEW', badgeStyle: 'badgeReview', textStyle: 'badgeTextReview' },
  { id: '3', title: 'Nutri Bar Classic', sub: '40 g', status: 'FAIL', badgeStyle: 'badgeFail', textStyle: 'badgeTextFail' },
];

const ProductSelection = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState('Packaged food');
  const [search, setSearch] = useState('');

  return (
    <Container style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Text style={styles.subHeader}>NEW INSPECTION</Text>
        <Text style={styles.title}>Select product</Text>
        <Text style={styles.description}>Choose a category or scan a barcode to begin</Text>

        {/* Search Input */}
        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search product or brand..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.input}
          />
        </View>

        {/* Category Grid */}
        <View style={styles.categoryGrid}>
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.categoryCard, isActive ? styles.catActive : styles.catInactive]}
              >
                <Text style={[styles.catText, isActive ? styles.catTextActive : styles.catTextInactive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recently Inspected */}
        <Text style={styles.sectionHeader}>RECENTLY INSPECTED</Text>
        {RECENT_PRODUCTS.map(item => (
          <View key={item.id} style={styles.inspectionItem}>
            <View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSub}>{item.sub}</Text>
            </View>
            <View style={[styles.badge, styles[item.badgeStyle]]}>
              <Text style={styles[item.textStyle]}>{item.status}</Text>
            </View>
          </View>
        ))}

        {/* Start Button */}
        <AppButton
          title="Start inspection"
          textStyle={styles.btnText}
          style={styles.btn}
          onPress={() => navigation.navigate('ImageCapture')}
        />
      </ScrollView>
    </Container>
  );
};

export default ProductSelection;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingHorizontal: moderateScale(20), paddingTop: moderateScale(40), paddingBottom: moderateScale(20) },
  subHeader: { fontSize: moderateScale(11), fontWeight: '700', color: '#64748B', letterSpacing: 0.8 },
  title: { fontSize: moderateScale(24), fontWeight: '700', color: '#0F172A', marginTop: moderateScale(4) },
  description: { fontSize: moderateScale(13), color: '#64748B', marginBottom: moderateScale(20) },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    height: moderateScale(48),
    justifyContent: 'center',
    marginBottom: moderateScale(16),
  },
  input: { fontSize: moderateScale(14), color: '#0F172A' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: moderateScale(24) },
  categoryCard: {
    width: '48%',
    height: moderateScale(50),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    paddingHorizontal: moderateScale(14),
    marginBottom: moderateScale(12),
  },
  catActive: { backgroundColor: '#0F172A' },
  catInactive: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  catText: { fontSize: moderateScale(13), fontWeight: '600' },
  catTextActive: { color: '#FFFFFF' },
  catTextInactive: { color: '#0F172A' },
  sectionHeader: { fontSize: moderateScale(11), fontWeight: '700', color: '#64748B', letterSpacing: 0.8, marginBottom: moderateScale(12) },
  inspectionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: moderateScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemTitle: { fontSize: moderateScale(14), fontWeight: '600', color: '#0F172A' },
  itemSub: { fontSize: moderateScale(12), color: '#94A3B8', marginTop: moderateScale(2) },
  badge: { paddingHorizontal: moderateScale(10), paddingVertical: moderateScale(4), borderRadius: moderateScale(12) },
  badgePass: { backgroundColor: '#DCFCE7' },
  badgeTextPass: { color: '#16A34A', fontSize: moderateScale(10), fontWeight: '700' },
  badgeReview: { backgroundColor: '#FEF3C7' },
  badgeTextReview: { color: '#D97706', fontSize: moderateScale(10), fontWeight: '700' },
  badgeFail: { backgroundColor: '#FEE2E2' },
  badgeTextFail: { color: '#DC2626', fontSize: moderateScale(10), fontWeight: '700' },
  btn: { backgroundColor: '#0F172A', borderRadius: moderateScale(12), height: moderateScale(52), justifyContent: 'center', marginTop: moderateScale(28) },
  btnText: { color: '#FFFFFF', fontSize: moderateScale(15), fontWeight: '600' },
});